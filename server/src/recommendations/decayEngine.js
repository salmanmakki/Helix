/**
 * Decay Engine
 * Formula: effectiveScore = masteryScore * Math.exp(-lambda * daysSinceRevision)
 */

/**
 * Maps revision difficulty to cognitive decay rates (lambda).
 * A lower lambda means the knowledge decays slower.
 * Easy revisions yield stronger retention, while Hard revisions indicate faster decay.
 */
const getLambdaByDifficulty = (difficulty) => {
  const diff = String(difficulty).toLowerCase();
  switch (diff) {
    case 'easy':
      return 0.02; // slow decay
    case 'medium':
      return 0.04; // moderate decay
    case 'hard':
      return 0.07; // rapid decay
    default:
      return 0.05; // default decay rate
  }
};

/**
 * Calculates the current decayed effective score of a skill.
 * @param {number} masteryScore - base skill mastery (0 - 100)
 * @param {Date|string} lastRevisedDate - date when the skill was last revised
 * @param {string|number} lambdaParam - difficulty string ('easy', 'medium', 'hard') or explicit decay rate
 * @returns {number} calculated effective score, bounded between 0 and 100, rounded to nearest integer
 */
const calculateDecayedScore = (masteryScore, lastRevisedDate, lambdaParam = 'medium') => {
  if (!lastRevisedDate) {
    return Math.round(masteryScore);
  }

  const lastRevised = new Date(lastRevisedDate);
  const now = new Date();
  
  // Calculate difference in days (with sub-day floating point precision)
  const diffTime = Math.max(0, now.getTime() - lastRevised.getTime());
  const daysSinceRevision = diffTime / (1000 * 60 * 60 * 24);

  let lambda = 0.05;
  if (typeof lambdaParam === 'number') {
    lambda = lambdaParam;
  } else {
    lambda = getLambdaByDifficulty(lambdaParam);
  }

  const effectiveScore = masteryScore * Math.exp(-lambda * daysSinceRevision);
  
  // Ensure boundaries (0 to 100) and round
  return Math.max(0, Math.min(100, Math.round(effectiveScore)));
};

module.exports = {
  calculateDecayedScore,
  getLambdaByDifficulty
};
