const Skill = require('../models/Skill');
const FailureReport = require('../models/FailureReport');
const { calculateReadiness } = require('./readinessEngine');
const geminiService = require('../ai/services/gemini.service');

/**
 * Assesses skill risk categorization and maps recommendations.
 * Supports OpenAI/Gemini mock logic for future-ready extensions.
 * @param {string} userId - User identifier
 * @returns {Promise<object>} risk payload: { threatLevel, criticalRisks, allModules, recommendations }
 */
const runRiskDiagnostic = async (userId) => {
  const skills = await Skill.find({ user: userId });
  const recentFailures = await FailureReport.find({ user: userId }).sort({ date: -1 }).limit(5);
  const readiness = await calculateReadiness(userId);

  const criticalRisks = [];
  const allModules = [];
  const recommendations = [];
  const highRiskTopics = [];
  const mediumRiskTopics = [];
  const lowRiskTopics = [];

  skills.forEach(skill => {
    const riskScore = Math.max(0, Math.min(100, Math.round(100 - skill.effectiveScore)));
    let status = 'STABLE';
    const daysSinceRevision = Math.max(0, Math.ceil((Date.now() - new Date(skill.lastRevised).getTime()) / (1000 * 60 * 60 * 24)));
    const diagnostics = [
      `MASTERY: ${skill.masteryScore}%`,
      `EFFECTIVE: ${skill.effectiveScore}%`,
      `LAST REVISED: ${daysSinceRevision} day${daysSinceRevision === 1 ? '' : 's'} ago`
    ];
    
    if (riskScore > 50) {
      status = 'CRITICAL';
      criticalRisks.push({
        id: skill._id.toString(),
        name: skill.name,
        score: skill.effectiveScore,
        mastery: skill.masteryScore,
        lastRevised: skill.lastRevised,
        status: 'critical',
        diagnostics
      });
      highRiskTopics.push(skill.name);
      recommendations.push(`Urgent review required for ${skill.name}. Risk level is at ${riskScore}%. Log a mock drill practice session.`);
    } else if (riskScore > 25) {
      status = 'CAUTION';
      criticalRisks.push({
        id: skill._id.toString(),
        name: skill.name,
        score: skill.effectiveScore,
        mastery: skill.masteryScore,
        lastRevised: skill.lastRevised,
        status: 'medium',
        diagnostics
      });
      mediumRiskTopics.push(skill.name);
      recommendations.push(`Plan a revision session for ${skill.name} within the next 48 hours to arrest cognitive memory decay.`);
    } else {
      lowRiskTopics.push(skill.name);
    }

    allModules.push({
      module: skill.name,
      riskScore,
      lastRevision: skill.lastRevised,
      status
    });
  });

  // Factor in recent mock failures
  recentFailures.forEach(fail => {
    recommendations.push(`Weakness diagnosed in ${fail.topic} during recent ${fail.company} mock. Review primary failure mode: "${fail.primaryReason}".`);
    if (!highRiskTopics.includes(fail.topic)) {
      highRiskTopics.push(fail.topic);
    }
  });

  try {
    if (geminiService.isAvailable()) {
      const context = {
        skills: criticalRisks.map(r => ({ name: r.name, score: r.score, status: r.status })),
        recentFailures: recentFailures.map(f => ({ company: f.company, topic: f.topic, primaryReason: f.primaryReason })),
        readinessScore: readiness.overallScore,
        threatLevel: readiness.threatLevel
      };
      const aiPlan = await geminiService.generateInsights(context);
      recommendations.push(`[AI-GENERATED PLAN] ${aiPlan}`);
    }
  } catch (err) {
    console.warn('[RiskEngine] Gemini AI plan generation failed, falling back to rule-based recommendations:', err.message);
  }

  // Default recommendations if list is empty
  if (recommendations.length === 0) {
    recommendations.push('Maintain your current revision frequency. Cognitive retention is stable.');
  }

  const uniqueRecommendations = [...new Set(recommendations)];

  const highRiskCount = criticalRisks.filter(r => r.status === 'critical').length;
  const totalSkills = skills.length;
  const cognitiveLoad = totalSkills > 0
    ? Math.round((highRiskCount / totalSkills) * 100)
    : 0;
  const probabilityOfFailure = totalSkills > 0
    ? Math.min(100, Math.round(readiness.overallScore * 0.6 + cognitiveLoad * 0.4))
    : 0;
  const pofDescription = probabilityOfFailure > 70
    ? 'Critical — immediate intervention required across multiple skill domains.'
    : probabilityOfFailure > 40
      ? 'Elevated — targeted revision sessions recommended for high-risk areas.'
      : 'Manageable — maintain current revision cadence to preserve retention.';

  return {
    threatLevel: highRiskCount > 0 ? 'critical' : (criticalRisks.length > 0 ? 'medium' : 'low'),
    readinessScore: readiness.overallScore,
    recentFailuresCount: recentFailures.length,
    cognitiveLoad,
    probabilityOfFailure,
    pofDescription,
    criticalRisks: criticalRisks.sort((a, b) => b.score - a.score),
    allModules,
    highRiskTopics: [...new Set(highRiskTopics)],
    mediumRiskTopics: [...new Set(mediumRiskTopics)],
    lowRiskTopics: [...new Set(lowRiskTopics)],
    recommendations: uniqueRecommendations
  };
};

module.exports = {
  runRiskDiagnostic
};
