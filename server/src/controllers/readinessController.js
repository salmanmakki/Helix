const { calculateReadiness } = require('../recommendations/readinessEngine');
const ReadinessScore = require('../models/ReadinessScore');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get current readiness details and save history log
// @route   GET /api/readiness
// @access  Private
const getReadiness = asyncHandler(async (req, res) => {
  const data = await calculateReadiness(req.user._id);

  // Save calculation to historical log
  await ReadinessScore.create({
    user: req.user._id,
    overallScore: data.overallScore,
    score: data.overallScore,
    threatLevel: data.threatLevel,
    riskLevel: data.threatLevel,
    highRiskTopics: data.highRiskTopics || [],
    recommendations: data.recommendations
  });

  return apiResponse.success(res, data, 'Readiness metrics retrieved successfully');
});

// @desc    Get historical readiness scores over time
// @route   GET /api/readiness/history
// @access  Private
const getReadinessHistory = asyncHandler(async (req, res) => {
  const history = await ReadinessScore.find({ user: req.user._id })
    .sort({ createdAt: 1 }) // Chronological order
    .limit(30);
  
  return apiResponse.success(res, history, 'Readiness history retrieved successfully');
});

// @desc    Manually trigger recalculation of readiness score
// @route   POST /api/readiness/recalculate
// @access  Private
const recalculateReadiness = asyncHandler(async (req, res) => {
  const data = await calculateReadiness(req.user._id);

  // Update/Save calculation to historical log
  await ReadinessScore.create({
    user: req.user._id,
    overallScore: data.overallScore,
    score: data.overallScore,
    threatLevel: data.threatLevel,
    riskLevel: data.threatLevel,
    highRiskTopics: data.highRiskTopics || [],
    recommendations: data.recommendations
  });

  return apiResponse.success(res, data, 'Readiness score recomputed successfully');
});

module.exports = {
  getReadiness,
  getReadinessHistory,
  recalculateReadiness
};
