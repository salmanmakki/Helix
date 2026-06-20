const { calculateDecayedScore } = require('./decayEngine');
const Skill = require('../models/Skill');
const FailureReport = require('../models/FailureReport');

/**
 * Calculates user overall readiness score, threat levels, and recommends actions.
 * @param {string} userId - User identifier
 * @returns {Promise<object>} readiness payload: { overallScore, threatLevel, recommendations }
 */
const calculateReadiness = async (userId) => {
  // 1. Fetch user's skills
  const skills = await Skill.find({ user: userId });
  const highRiskTopics = [];
  
  if (skills.length === 0) {
    return {
      overallScore: 70,
      threatLevel: 'medium',
      highRiskTopics: [],
      recommendations: [
        'Initialize your profile by adding key skills (e.g., DSA, DBMS, OS).',
        'Log a revision to begin tracking cognitive decay.'
      ]
    };
  }

  // Calculate decayed effective score for each skill
  let totalEffectiveScore = 0;
  let criticalSkillsCount = 0;
  const recommendations = [];

  const decayedSkills = skills.map(skill => {
    // Note: If no revisions are logged yet, calculateDecayedScore uses the lastRevised date, defaulting to creation time.
    // We estimate decay based on the difficulty of the skill or a default 'medium'.
    const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, 'medium');
    
    // Save updated effective score back to DB asynchronously (fire-and-forget for speed)
    skill.effectiveScore = effective;
    
    // Assess risk level for individual skills
    if (effective < 50) {
      skill.riskLevel = 'high';
      criticalSkillsCount++;
      highRiskTopics.push(skill.name);
    } else if (effective < 75) {
      skill.riskLevel = 'medium';
    } else {
      skill.riskLevel = 'low';
    }
    
    skill.save().catch(err => console.error(`Failed to save skill decay: ${err.message}`));

    totalEffectiveScore += effective;

    // Generate recommendations based on decay
    const decayAmount = skill.masteryScore - effective;
    if (decayAmount >= 15) {
      recommendations.push(`Revise ${skill.name} immediately. Recall has decayed by ${decayAmount}% in the last few days.`);
    }

    return skill;
  });

  const baseReadiness = totalEffectiveScore / skills.length;

  // 2. Fetch user's failures within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentFailures = await FailureReport.find({
    user: userId,
    date: { $gte: thirtyDaysAgo }
  });

  // Apply failure penalty: deduct 5 points per recent failure, up to a max of 30 points
  const failurePenalty = Math.min(30, recentFailures.length * 5);
  let overallScore = Math.max(0, Math.min(100, Math.round(baseReadiness - failurePenalty)));

  // Add recommendations based on failures
  recentFailures.forEach(fail => {
    recommendations.push(`Practice drill: Review ${fail.topic} questions to address recent failure at ${fail.company} (${fail.roundFailed}).`);
    highRiskTopics.push(fail.topic);
  });

  // 3. Determine overall Threat Level
  // 'critical': score < 60 or if there are multiple high-risk skills or recent failures
  // 'medium': 60 <= score < 80
  // 'low': score >= 80
  let threatLevel = 'medium';
  if (overallScore < 60 || criticalSkillsCount >= 2 || recentFailures.length >= 3) {
    threatLevel = 'critical';
  } else if (overallScore >= 80 && criticalSkillsCount === 0) {
    threatLevel = 'low';
  }

  // Fallback recommendations if empty
  if (recommendations.length === 0) {
    if (overallScore < 80) {
      recommendations.push('Review OS Deadlocks and Scheduling algorithms to bump your score.');
    } else {
      recommendations.push('Maintain active revision logs to keep decay rate near 0%.');
    }
  }

  return {
    overallScore,
    threatLevel,
    highRiskTopics: [...new Set(highRiskTopics)],
    recommendations: [...new Set(recommendations)] // Deduplicate
  };
};

module.exports = {
  calculateReadiness
};
