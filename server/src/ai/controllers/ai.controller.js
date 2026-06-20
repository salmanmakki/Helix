const geminiService = require('../services/gemini.service');
const failureAnalyzerService = require('../services/failureAnalyzer.service');
const asyncHandler = require('../../utils/asyncHandler');
const apiResponse = require('../../utils/apiResponse');
const Skill = require('../../models/Skill');
const FailureReport = require('../../models/FailureReport');
const CommunityFailureReport = require('../../models/CommunityFailureReport');
const Revision = require('../../models/Revision');

const checkAvailability = (req, res, next) => {
  if (!geminiService.isAvailable()) {
    return apiResponse.error(res, 'Gemini AI is not configured. Set GEMINI_API_KEY environment variable.', 503);
  }
  next();
};

const getInsights = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id }).lean();
  const recentFailures = await FailureReport.find({ user: req.user._id }).sort({ date: -1 }).limit(5).lean();
  const revisions = await Revision.find({ user: req.user._id }).lean();

  const avgRecall = revisions.length > 0
    ? Math.round(revisions.reduce((acc, r) => acc + (r.recallScore || 0), 0) / revisions.length)
    : null;

  const userContext = {
    skills: skills.map(s => ({ name: s.name, masteryScore: s.masteryScore, effectiveScore: s.effectiveScore, riskLevel: s.riskLevel })),
    recentFailures: recentFailures.map(f => ({ company: f.company, topic: f.topic, role: f.role, primaryReason: f.primaryReason })),
    readinessScore: req.query.readiness || null,
    threatLevel: req.query.threatLevel || null,
    revisionCount: revisions.length,
    avgRecall
  };

  let insights;
  try {
    insights = await geminiService.generateInsights(userContext);
  } catch (err) {
    console.error('[AI Controller] getInsights error:', err.message);
    console.warn('[AI Controller] Falling back to statistical insights');
    const highRiskSkills = skills.filter(s => s.riskLevel === 'high');
    const decayingSkills = skills.filter(s => (s.masteryScore || 0) - (s.effectiveScore || 0) > 10);
    const totalDuration = revisions.reduce((acc, r) => acc + (r.duration || 0), 0);
    const topicCounts = {};
    const reasonCounts = {};
    recentFailures.forEach(f => {
      if (f.topic) topicCounts[f.topic] = (topicCounts[f.topic] || 0) + 1;
      if (f.primaryReason) reasonCounts[f.primaryReason] = (reasonCounts[f.primaryReason] || 0) + 1;
    });
    const topFailTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topFailReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    let text = '';
    if (skills.length > 0) {
      text += `**Skill Health:**\nYou have ${skills.length} tracked skill${skills.length > 1 ? 's' : ''}. ${highRiskSkills.length > 0 ? `${highRiskSkills.length} high-risk skill${highRiskSkills.length > 1 ? 's' : ''} (${highRiskSkills.map(s => s.name).join(', ')})` : 'No high-risk skills'} and ${decayingSkills.length} skill${decayingSkills.length > 1 ? 's' : ''} showing decay.\n\n**Evidence:**\nAverage effective score across all skills: ${skills.length > 0 ? Math.round(skills.reduce((acc, s) => acc + (s.effectiveScore || 0), 0) / skills.length) : 'N/A'}%. Decaying skills (>10% gap): ${decayingSkills.length > 0 ? decayingSkills.map(s => `${s.name} (${Math.round((s.masteryScore || 0) - (s.effectiveScore || 0))}% decay)`).join(', ') : 'None'}.\n\n**Impact:**\nUnchecked decay reduces interview readiness. High-risk skills indicate topics where you are most vulnerable to failure.\n\n**Recommendation:**\n${highRiskSkills.length > 0 ? `Prioritize revision of: ${highRiskSkills.map(s => s.name).join(', ')}.` : 'Maintain your current revision cadence.'} ${decayingSkills.length > 0 ? `Schedule sessions for decaying skills within the next ${Math.max(1, Math.min(7, Math.round(decayingSkills.length / 2)))} days.` : ''}\n\n`;
    }
    if (revisions.length > 0) {
      text += `**Revision Activity:**\nYou completed ${revisions.length} revision session${revisions.length > 1 ? 's' : ''} with ${avgRecall !== null ? `${avgRecall}%` : 'N/A'} average recall across ${Math.round(totalDuration / 60)} total hours.\n\n**Evidence:**\nTotal sessions: ${revisions.length}. Average recall: ${avgRecall !== null ? `${avgRecall}%` : 'N/A'}. Total study time: ${Math.round(totalDuration / 60)} hours.\n\n**Impact:**\nConsistent revision with high recall correlates strongly with interview success. ${avgRecall !== null && avgRecall < 70 ? 'Your recall is below the 70% threshold, suggesting a need to increase revision frequency.' : avgRecall !== null && avgRecall >= 90 ? 'Your recall is excellent — maintain your current approach.' : 'Your recall is solid — focus on consistency.'}\n\n**Recommendation:**\n${revisions.length < 5 ? 'Aim for at least 5 revision sessions per week to build momentum.' : avgRecall !== null && avgRecall < 70 ? 'Use active recall techniques and space repetitions closer together (every 2-3 days).' : 'Continue your current approach and ensure coverage of all high-risk skills.'}\n\n`;
    }
    if (recentFailures.length > 0) {
      text += `**Failure Analysis:**\nYou have ${recentFailures.length} recent failure${recentFailures.length > 1 ? 's' : ''} in the last 30 days. ${topFailTopics.length > 0 ? `Most frequent topic: ${topFailTopics[0][0]}.` : ''} ${topFailReasons.length > 0 ? `Most common reason: ${topFailReasons[0][0]}.` : ''}\n\n**Evidence:**\n${topFailTopics.length > 0 ? `Topics: ${topFailTopics.map(([t, c]) => `${t} (${c}x)`).join(', ')}.` : 'No topic patterns.'} ${topFailReasons.length > 0 ? `Reasons: ${topFailReasons.map(([r, c]) => `${r} (${c}x)`).join(', ')}.` : ''}\n\n**Impact:**\nFailure patterns reveal specific knowledge gaps. Addressing these directly reduces the risk of repeat failures.\n\n**Recommendation:**\n${topFailTopics.length > 0 ? `Dedicate focused study time to ${topFailTopics[0][0]}.` : 'Continue documenting failures to identify patterns.'} ${topFailReasons.length > 0 ? `Work on ${topFailReasons[0][0].toLowerCase()} through targeted practice and mock interviews.` : ''}\n\n`;
    }
    if (skills.length === 0 && revisions.length === 0 && recentFailures.length === 0) {
      text = '**No data available yet.**\n\nStart by adding skills, logging revisions, and documenting failures. As you build your preparation history, AI-powered insights will become available here.\n\n**Getting Started:**\n1. Add your first skill from the Skills page\n2. Log a revision session\n3. Document any interview failures to unlock pattern analysis';
    }
    insights = text.trim();
  }
  return apiResponse.success(res, { insights, generatedAt: new Date().toISOString() }, 'Insights generated');
});

const analyzeAndStoreFailure = asyncHandler(async (req, res) => {
  const { notes, interviewId } = req.body;
  let result;
  try {
    result = await failureAnalyzerService.analyzeAndStore(
      req.user._id,
      notes,
      { interviewId }
    );
  } catch (err) {
    console.error('[AI Controller] analyzeAndStoreFailure error:', err.message);
    return apiResponse.error(res, 'AI failure analysis temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, result, 'Failure report created from AI analysis', 201);
});

const analyzeText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  let analysis;
  try {
    analysis = await geminiService.analyzeFailureText(text);
  } catch (err) {
    console.error('[AI Controller] analyzeText error:', err.message);
    return apiResponse.error(res, 'AI analysis temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, { analysis, generatedAt: new Date().toISOString() }, 'Text analyzed');
});

const explainRisk = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id }).lean();
  const revisions = await Revision.find({ user: req.user._id }).sort({ date: -1 }).lean();
  const failures = await FailureReport.find({ user: req.user._id }).sort({ date: -1 }).lean();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentFailures = failures.filter(f => new Date(f.date) >= thirtyDaysAgo);
  const totalDuration = revisions.reduce((acc, r) => acc + (r.duration || 0), 0);
  const avgRecall = revisions.length > 0
    ? Math.round(revisions.reduce((acc, r) => acc + (r.recallScore || 0), 0) / revisions.length)
    : null;
  const daysSinceLastRevision = revisions.length > 0
    ? Math.max(0, Math.ceil((Date.now() - new Date(revisions[0].date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const topicFrequency = {};
  const reasonFrequency = {};
  failures.forEach(f => {
    topicFrequency[f.topic] = (topicFrequency[f.topic] || 0) + 1;
    reasonFrequency[f.primaryReason] = (reasonFrequency[f.primaryReason] || 0) + 1;
  });
  const topFailureTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
  const commonReasons = Object.entries(reasonFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason]) => reason);

  const baseReadiness = skills.length > 0
    ? Math.round(skills.reduce((acc, s) => acc + s.effectiveScore, 0) / skills.length)
    : null;
  const failurePenalty = Math.min(30, recentFailures.length * 5);
  const readinessScore = baseReadiness !== null
    ? Math.max(0, Math.min(100, baseReadiness - failurePenalty))
    : null;

  let threatLevel = 'medium';
  if (readinessScore !== null) {
    const criticalSkills = skills.filter(s => s.riskLevel === 'high').length;
    if (readinessScore < 60 || criticalSkills >= 2 || recentFailures.length >= 3) {
      threatLevel = 'critical';
    } else if (readinessScore >= 80 && criticalSkills === 0) {
      threatLevel = 'low';
    }
  }

  const riskContext = {
    readinessScore,
    threatLevel,
    failurePenalty,
    skills: skills.map(s => ({
      name: s.name,
      masteryScore: s.masteryScore,
      effectiveScore: s.effectiveScore,
      decay: Math.max(0, s.masteryScore - s.effectiveScore),
      riskLevel: s.riskLevel
    })),
    revisionCount: revisions.length,
    avgRecall,
    totalDuration,
    daysSinceLastRevision,
    failureCount: failures.length,
    recentFailureCount: recentFailures.length,
    topFailureTopics,
    commonReasons
  };

  let explanation;
  try {
    explanation = await geminiService.explainRisk(riskContext);
  } catch (err) {
    console.error('[AI Controller] explainRisk error:', err.message);
    return apiResponse.error(res, 'Risk explanation temporarily unavailable. Please try again later.', 503);
  }

  return apiResponse.success(res, {
    explanation,
    riskContext,
    generatedAt: new Date().toISOString()
  }, 'Risk explanation generated');
});

const getDashboardInsights = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id }).lean();
  const revisions = await Revision.find({ user: req.user._id }).sort({ date: -1 }).lean();
  const failures = await FailureReport.find({ user: req.user._id }).sort({ date: -1 }).lean();

  const revisionCountsBySkill = {};
  let lastRevisionDate = null;
  revisions.forEach(r => {
    const name = typeof r.skill === 'object' && r.skill ? r.skill.name : 'Unknown';
    revisionCountsBySkill[name] = (revisionCountsBySkill[name] || 0) + 1;
    if (!lastRevisionDate || new Date(r.date) > new Date(lastRevisionDate)) {
      lastRevisionDate = r.date;
    }
  });

  const avgRecall = revisions.length > 0
    ? Math.round(revisions.reduce((acc, r) => acc + (r.recallScore || 0), 0) / revisions.length)
    : null;

  const baseReadiness = skills.length > 0
    ? Math.round(skills.reduce((acc, s) => acc + s.effectiveScore, 0) / skills.length)
    : null;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentFailures = failures.filter(f => new Date(f.date) >= thirtyDaysAgo);
  const failurePenalty = Math.min(30, recentFailures.length * 5);
  const readinessScore = baseReadiness !== null
    ? Math.max(0, Math.min(100, baseReadiness - failurePenalty))
    : null;

  let threatLevel = 'medium';
  if (readinessScore !== null) {
    const criticalSkills = skills.filter(s => s.riskLevel === 'high').length;
    if (readinessScore < 60 || criticalSkills >= 2 || recentFailures.length >= 3) {
      threatLevel = 'critical';
    } else if (readinessScore >= 80 && criticalSkills === 0) {
      threatLevel = 'low';
    }
  }

  const context = {
    skills: skills.map(s => ({
      name: s.name,
      masteryScore: s.masteryScore,
      effectiveScore: s.effectiveScore,
      decay: Math.max(0, s.masteryScore - s.effectiveScore),
      riskLevel: s.riskLevel,
      lastRevised: s.lastRevised,
      daysSinceRevision: s.lastRevised ? Math.max(0, Math.ceil((Date.now() - new Date(s.lastRevised).getTime()) / (1000 * 60 * 60 * 24))) : null
    })),
    revisionCount: revisions.length,
    lastRevisionDate,
    avgRecall,
    revisionCountsBySkill,
    failures: failures.map(f => ({
      company: f.company,
      role: f.role,
      topic: f.topic,
      roundFailed: f.roundFailed,
      primaryReason: f.primaryReason,
      date: f.date
    })),
    readinessScore,
    threatLevel
  };

  let insights;
  try {
    insights = await geminiService.generateDashboardInsights(context);
  } catch (err) {
    console.error('[AI Controller] getDashboardInsights error:', err.message);
    return apiResponse.error(res, 'Dashboard insights temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, insights, 'Dashboard insights generated');
});

const generateStudyPlan = asyncHandler(async (req, res) => {
  const { targetCompany, targetRole, daysAvailable } = req.body;

  const skills = await Skill.find({ user: req.user._id }).lean();
  const revisions = await Revision.find({ user: req.user._id }).sort({ date: -1 }).lean();
  const failures = await FailureReport.find({ user: req.user._id }).sort({ date: -1 }).lean();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentFailures = failures.filter(f => new Date(f.date) >= thirtyDaysAgo);

  const totalDuration = revisions.reduce((acc, r) => acc + (r.duration || 0), 0);
  const avgRecall = revisions.length > 0
    ? Math.round(revisions.reduce((acc, r) => acc + (r.recallScore || 0), 0) / revisions.length)
    : null;

  const topicFrequency = {};
  failures.forEach(f => { topicFrequency[f.topic] = (topicFrequency[f.topic] || 0) + 1; });
  const topFailureTopics = Object.entries(topicFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  const params = {
    targetCompany,
    targetRole,
    daysAvailable,
    skills: skills.map(s => ({
      name: s.name,
      masteryScore: s.masteryScore,
      effectiveScore: s.effectiveScore,
      decay: Math.max(0, s.masteryScore - s.effectiveScore),
      riskLevel: s.riskLevel
    })),
    revisionCount: revisions.length,
    avgRecall,
    totalDuration,
    failureCount: failures.length,
    recentFailureCount: recentFailures.length,
    topFailureTopics,
    commonReasons: []
  };

  let result;
  try {
    result = await geminiService.generateStudyPlan(params);
  } catch (err) {
    console.error('[AI Controller] generateStudyPlan error:', err.message);
    return apiResponse.error(res, 'Study plan temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, result, 'Study plan generated');
});

const getSuggestedTasks = asyncHandler(async (req, res) => {
  const skills = await Skill.find({ user: req.user._id }).lean();
  const skillsWithDecay = skills
    .filter(s => s.decayScore > 5)
    .map(s => ({
      name: s.name,
      masteryScore: s.masteryScore,
      effectiveScore: s.effectiveScore,
      decayScore: s.decayScore,
      riskLevel: s.riskLevel,
      lastRevised: s.lastRevised,
      daysSinceRevision: s.lastRevised ? Math.max(0, Math.ceil((Date.now() - new Date(s.lastRevised).getTime()) / (1000 * 60 * 60 * 24))) : null
    }))
    .sort((a, b) => b.decayScore - a.decayScore);

  if (skillsWithDecay.length === 0) {
    return apiResponse.success(res, [], 'No skills with decay found');
  }

  let tasks;
  try {
    const raw = await geminiService.generateSuggestedTasks(skillsWithDecay);
    try {
      tasks = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      tasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }
  } catch (err) {
    console.error('[AI Controller] getSuggestedTasks error:', err.message);
    tasks = skillsWithDecay.map(s => ({
      topic: s.name,
      reason: `${s.decayScore}% decay, last revised ${s.daysSinceRevision ?? 'N/A'} days ago`,
      estimatedSessions: s.decayScore > 20 ? 3 : s.decayScore > 10 ? 2 : 1,
      difficulty: s.riskLevel === 'high' ? 'HARD' : s.riskLevel === 'medium' ? 'MED' : 'EASY',
      duration: s.riskLevel === 'high' ? '45 mins' : s.riskLevel === 'medium' ? '30 mins' : '20 mins',
      suggestedAction: `Revise ${s.name} focusing on weak areas`
    }));
  }

  return apiResponse.success(res, tasks, 'Suggested tasks generated');
});

const generateDrill = asyncHandler(async (req, res) => {
  const { skillName, difficulty } = req.body;
  let scenario;
  try {
    scenario = await geminiService.generateDrillScenario(skillName, difficulty);
  } catch (err) {
    console.error('[AI Controller] generateDrill error:', err.message);
    return apiResponse.error(res, 'Drill scenario temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, { scenario, skillName, difficulty: difficulty || 'medium', generatedAt: new Date().toISOString() }, 'Drill scenario generated');
});

const buildCommunityFallbackAnalysis = (reports) => {
  const total = reports.length;
  const topicCounts = {};
  const reasonCounts = {};
  const companyCounts = {};
  const roundCounts = {};
  const roleCounts = {};

  reports.forEach(r => {
    if (r.topic) topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1;
    if (r.primaryReason) reasonCounts[r.primaryReason] = (reasonCounts[r.primaryReason] || 0) + 1;
    if (r.company) companyCounts[r.company] = (companyCounts[r.company] || 0) + 1;
    if (r.roundFailed) roundCounts[r.roundFailed] = (roundCounts[r.roundFailed] || 0) + 1;
    if (r.role) roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
  });

  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topRounds = Object.entries(roundCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const pct = (count) => Math.round((count / total) * 100);

  let analysis = '';

  if (topTopics.length > 0) {
    analysis += `**Observation:**\nCandidates struggle most with ${topTopics[0][0]} (${pct(topTopics[0][1])}% of reports), followed by ${topTopics.length > 1 ? topTopics[1][0] : 'other'} topics.\n\n**Evidence:**\nOut of ${total} community reports, ${topTopics.map(([t, c]) => `${t}: ${c} report${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nThese topics represent the highest-risk areas for interview preparation across the community.\n\n**Recommendation:**\nPrioritize study time on ${topTopics[0][0]} and ${topTopics.length > 1 ? topTopics[1][0] : 'related high-frequency topics'}.\n\n`;
  }

  if (topReasons.length > 0) {
    analysis += `**Observation:**\nThe most common failure reason is "${topReasons[0][0]}" (${pct(topReasons[0][1])}% of reports).\n\n**Evidence:**\n${topReasons.map(([r, c]) => `${r}: ${c} report${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nRecurring failure reasons point to systemic preparation gaps that affect candidates across companies.\n\n**Recommendation:**\nFocus on strengthening ${topReasons[0][0].toLowerCase()} through targeted practice and structured revision.\n\n`;
  }

  if (topRounds.length > 0) {
    analysis += `**Observation:**\nThe ${topRounds[0][0]} round has the highest failure rate (${pct(topRounds[0][1])}% of reports).\n\n**Evidence:**\n${topRounds.map(([r, c]) => `${r}: ${c} report${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nCertain interview rounds are consistently harder, indicating where candidates should focus their preparation.\n\n**Recommendation:**\nAllocate extra preparation time for ${topRounds[0][0]} rounds with mock interviews and timed practice.\n\n`;
  }

  if (topCompanies.length > 0) {
    analysis += `**Observation:**\nNotable failure patterns emerge at ${topCompanies[0][0]} (${pct(topCompanies[0][1])}% of reports).\n\n**Evidence:**\n${topCompanies.map(([c, n]) => `${c}: ${n} report${n > 1 ? 's' : ''}`).join(', ')}.\n\n**Impact:**\nCompany-specific patterns help candidates target their preparation for their target companies.\n\n**Recommendation:**\nResearch company-specific interview formats and tailor practice accordingly.\n\n`;
  }

  if (topRoles.length > 0) {
    analysis += `**Observation:**\n${topRoles[0][0]} roles account for ${pct(topRoles[0][1])}% of reported failures.\n\n**Evidence:**\n${topRoles.map(([r, c]) => `${r}: ${c} report${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nRole-specific vulnerabilities help candidates understand which positions carry higher risk.\n\n**Recommendation:**\nEnsure role-specific preparation aligns with the most commonly failed areas for ${topRoles[0][0]} positions.\n\n`;
  }

  return analysis.trim();
};

const analyzeCommunityFailures = asyncHandler(async (req, res) => {
  const communityFailures = await CommunityFailureReport.find({}).sort({ date: -1 }).lean();

  if (communityFailures.length === 0) {
    return apiResponse.success(res, { analysis: 'No community failure data available yet. Be the first to share anonymously.' }, 'Community analysis completed');
  }

  let analysis;
  let fromAi = true;
  try {
    analysis = await geminiService.analyzeCommunityFailures(communityFailures);
  } catch (err) {
    console.error('[AI Controller] analyzeCommunityFailures error:', err.message);
    console.warn('[AI Controller] Falling back to statistical community analysis');
    analysis = buildCommunityFallbackAnalysis(communityFailures);
    fromAi = false;
  }
  return apiResponse.success(res, { analysis, reportCount: communityFailures.length, generatedAt: new Date().toISOString(), fromAi }, 'Community analysis generated');
});

const analyzeMyFailures = asyncHandler(async (req, res) => {
  const [myFailures, skills, revisions] = await Promise.all([
    FailureReport.find({ user: req.user._id }).sort({ date: -1 }).lean(),
    Skill.find({ user: req.user._id }).lean(),
    Revision.find({ user: req.user._id }).sort({ date: -1 }).lean()
  ]);

  if (myFailures.length === 0) {
    return apiResponse.success(res, { analysis: 'You haven\'t documented any failures yet. Log your first failure to get personalized insights.' }, 'My failure analysis completed');
  }

  const avgRecall = revisions.length > 0
    ? Math.round(revisions.reduce((acc, r) => acc + (r.recallScore || 0), 0) / revisions.length)
    : null;

  const baseReadiness = skills.length > 0
    ? Math.round(skills.reduce((acc, s) => acc + s.effectiveScore, 0) / skills.length)
    : null;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentFailures = myFailures.filter(f => new Date(f.date) >= thirtyDaysAgo);
  const failurePenalty = Math.min(30, recentFailures.length * 5);
  const readinessScore = baseReadiness !== null
    ? Math.max(0, Math.min(100, baseReadiness - failurePenalty))
    : null;

  let threatLevel = 'medium';
  if (readinessScore !== null) {
    const criticalSkills = skills.filter(s => s.riskLevel === 'high').length;
    if (readinessScore < 60 || criticalSkills >= 2 || recentFailures.length >= 3) {
      threatLevel = 'critical';
    } else if (readinessScore >= 80 && criticalSkills === 0) {
      threatLevel = 'low';
    }
  }

  const enrichedData = {
    ...myFailures,
    skills: skills.map(s => ({ name: s.name, masteryScore: s.masteryScore, effectiveScore: s.effectiveScore, riskLevel: s.riskLevel })),
    revisionCount: revisions.length,
    avgRecall,
    readinessScore,
    threatLevel
  };

  let analysis;
  let fromAi = true;
  try {
    analysis = await geminiService.analyzeMyFailures(enrichedData);
  } catch (err) {
    console.error('[AI Controller] analyzeMyFailures error:', err.message);
    console.warn('[AI Controller] Falling back to statistical personal analysis');
    const topicCounts = {};
    const reasonCounts = {};
    const companyCounts = {};
    const roundCounts = {};
    myFailures.forEach(f => {
      if (f.topic) topicCounts[f.topic] = (topicCounts[f.topic] || 0) + 1;
      if (f.primaryReason) reasonCounts[f.primaryReason] = (reasonCounts[f.primaryReason] || 0) + 1;
      if (f.company) companyCounts[f.company] = (companyCounts[f.company] || 0) + 1;
      if (f.roundFailed) roundCounts[f.roundFailed] = (roundCounts[f.roundFailed] || 0) + 1;
    });
    const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const topCompanies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const total = myFailures.length;
    const pct = (c) => Math.round((c / total) * 100);
    let text = '';
    if (topTopics.length > 0) {
      text += `**Observation:**\nYou fail most frequently on ${topTopics[0][0]} (${pct(topTopics[0][1])}% of your documented failures).\n\n**Evidence:**\nOut of ${total} failure${total > 1 ? 's' : ''}: ${topTopics.map(([t, c]) => `${t}: ${c} time${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nThis pattern indicates a gap in your preparation that recruiters will likely probe.\n\n**Recommendation:**\nDedicate focused study sessions to ${topTopics[0][0]} — aim for ${Math.min(5, Math.ceil(total / 2))} targeted revision cycles.\n\n`;
    }
    if (topReasons.length > 0) {
      text += `**Observation:**\nYour most common reason for failure is "${topReasons[0][0]}" (${pct(topReasons[0][1])}% of cases).\n\n**Evidence:**\n${topReasons.map(([r, c]) => `${r}: ${c} time${c > 1 ? 's' : ''} (${pct(c)}%)`).join(', ')}.\n\n**Impact:**\nRepeating the same mistakes suggests a need to change your preparation approach rather than just studying more.\n\n**Recommendation:**\nFocus on ${topReasons[0][0].toLowerCase()} — practice with mock interviews and timed conditions.\n\n`;
    }
    if (topCompanies.length > 0) {
      text += `**Observation:**\nYou have reported failures at ${topCompanies[0][0]}${topCompanies.length > 1 ? `, ${topCompanies.slice(1).map(([c]) => c).join(', ')}` : ''}.\n\n**Evidence:**\n${topCompanies.map(([c, n]) => `${c}: ${n} time${n > 1 ? 's' : ''}`).join(', ')}.\n\n**Impact:**\nCompany-specific preparation is critical — each company has a unique interview style.\n\n**Recommendation:**\nResearch target company interview formats and tailor your practice accordingly.\n\n`;
    }
    if (readinessScore !== null) {
      text += `**Observation:**\nYour current readiness score is ${readinessScore}/100 (${threatLevel} threat level) with ${skills.length} tracked skill${skills.length > 1 ? 's' : ''}.\n\n**Evidence:**\n${revisions.length > 0 ? `Average recall: ${avgRecall}% across ${revisions.length} revision session${revisions.length > 1 ? 's' : ''}.` : 'No revision sessions recorded yet.'} Recent failures (30 days): ${recentFailures.length}.\n\n**Impact:**\nYour readiness score directly correlates with interview outcomes — every ${10} points improvement reduces failure risk significantly.\n\n**Recommendation:**\n${readinessScore < 60 ? 'Focus on high-decay skills first. Increase revision frequency to at least 3 sessions per week.' : readinessScore < 80 ? 'Maintain current revision cadence but add one additional session focused on weak areas.' : 'Your readiness is strong. Maintain with regular revision and focus on maintaining high-risk skills.'}\n\n`;
    }
    analysis = text.trim();
    fromAi = false;
  }
  return apiResponse.success(res, { analysis, reportCount: myFailures.length, skillsCount: skills.length, revisionCount: revisions.length, readinessScore, threatLevel, generatedAt: new Date().toISOString(), fromAi }, 'Personal analysis generated');
});

const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const skills = await Skill.find({ user: req.user._id }).lean();
  const recentRevisions = await Revision.find({ user: req.user._id }).sort({ date: -1 }).limit(5).lean();
  const recentFailures = await FailureReport.find({ user: req.user._id }).sort({ date: -1 }).limit(3).lean();

  const userContext = {
    skills: skills.map(s => ({ name: s.name, effectiveScore: s.effectiveScore, riskLevel: s.riskLevel })),
    readinessScore: req.query.readiness || null,
    recentActivity: [
      ...recentRevisions.map(r => `Revision: ${r.revisionType || 'Study'} — ${r.recallScore || 0}% recall`),
      ...recentFailures.map(f => `Failure: ${f.company} ${f.topic} — ${f.primaryReason}`)
    ].join('\n')
  };

  let response;
  try {
    response = await geminiService.chat(message, userContext);
  } catch (err) {
    console.error('[AI Controller] chat error:', err.message);
    return apiResponse.error(res, 'Chat response temporarily unavailable. Please try again later.', 503);
  }
  return apiResponse.success(res, { response, generatedAt: new Date().toISOString() }, 'Response generated');
});

module.exports = {
  checkAvailability,
  getInsights,
  getDashboardInsights,
  analyzeAndStoreFailure,
  analyzeText,
  explainRisk,
  generateStudyPlan,
  getSuggestedTasks,
  generateDrill,
  analyzeCommunityFailures,
  analyzeMyFailures,
  chat
};
