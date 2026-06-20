const Skill = require('../models/Skill');
const Revision = require('../models/Revision');
const FailureReport = require('../models/FailureReport');
const { computeStreak } = require('./streakService');

/**
 * Compute a composite confidence score (0-100) and level label.
 *
 * Factors:
 *  - Avg effectiveScore of all skills         (weight 40 %)
 *  - Study streak (capped at 30 days)         (weight 20 %)
 *  - Recency: avg days since revision, invert (weight 20 %)
 *  - Failure rate inverted                    (weight 20 %)
 */
const computeConfidence = async (userId) => {
  const skills = await Skill.find({ user: userId }).lean();
  const streak = await computeStreak(userId);

  // 1. Average effective score
  const avgEffective = skills.length > 0
    ? skills.reduce((acc, s) => acc + (s.effectiveScore ?? s.masteryScore ?? 0), 0) / skills.length
    : 50;

  // 2. Streak score (capped at 30 days → 100 %)
  const streakScore = Math.min(100, (streak / 30) * 100);

  // 3. Recency score
  const now = Date.now();
  let recencyScore = 50;
  if (skills.length > 0) {
    const totalDays = skills.reduce((acc, s) => {
      const days = s.lastRevised
        ? Math.max(0, (now - new Date(s.lastRevised).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      return acc + days;
    }, 0);
    const avgDays = totalDays / skills.length;
    // 0 days → 100, 30+ days → 0
    recencyScore = Math.max(0, 100 - (avgDays / 30) * 100);
  }

  // 4. Failure rate score (inverted)
  const totalFailures = await FailureReport.countDocuments({ user: userId });
  const totalRevisions = await Revision.countDocuments({ user: userId });
  const failureRate = (totalFailures + totalRevisions) > 0
    ? totalFailures / (totalFailures + totalRevisions)
    : 0;
  const failureScore = (1 - failureRate) * 100;

  // Composite
  const confidenceScore = Math.round(
    avgEffective * 0.40 +
    streakScore   * 0.20 +
    recencyScore  * 0.20 +
    failureScore  * 0.20
  );

  const clamped = Math.max(0, Math.min(100, confidenceScore));

  let confidenceLevel = 'MEDIUM';
  if (clamped >= 75) confidenceLevel = 'HIGH';
  else if (clamped < 50) confidenceLevel = 'LOW';

  return { confidenceScore: clamped, confidenceLevel };
};

module.exports = { computeConfidence };
