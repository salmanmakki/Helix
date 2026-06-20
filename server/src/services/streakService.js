const Revision = require('../models/Revision');

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Compute the current study streak: consecutive calendar days (backwards from today)
 * on which the user logged at least one revision.
 */
const computeStreak = async (userId) => {
  const revisions = await Revision.find({ user: userId })
    .select('date')
    .sort({ date: -1 })
    .lean();

  if (revisions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const seenDays = new Set();
  for (const r of revisions) {
    const d = new Date(r.date);
    d.setHours(0, 0, 0, 0);
    seenDays.add(d.getTime());
  }

  const sortedDays = [...seenDays].sort((a, b) => b - a);
  let streak = 0;
  let expected = today.getTime();

  for (const day of sortedDays) {
    const diff = (expected - day) / ONE_DAY_MS;
    if (diff === 0 || diff === 1) {
      streak++;
      expected = day;
    } else {
      break;
    }
  }

  return streak;
};

module.exports = { computeStreak };
