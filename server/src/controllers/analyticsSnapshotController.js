const AnalyticsSnapshot = require('../models/AnalyticsSnapshot');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const { computeStreak } = require('../services/streakService');
const { computeConfidence } = require('../services/confidenceService');

const getLatestSnapshot = asyncHandler(async (req, res) => {
  let snapshot = await AnalyticsSnapshot.findOne({ user: req.user._id })
    .sort({ timestamp: -1 });

  if (!snapshot) {
    const [streak, confidence] = await Promise.all([
      computeStreak(req.user._id),
      computeConfidence(req.user._id)
    ]);
    return apiResponse.success(res, {
      streak,
      confidenceScore: confidence.confidenceScore,
      confidenceLevel: confidence.confidenceLevel
    }, 'Live computed snapshot');
  }

  if (snapshot.confidenceScore === undefined || snapshot.confidenceScore === null) {
    const { confidenceScore } = await computeConfidence(req.user._id);
    snapshot = snapshot.toObject();
    snapshot.confidenceScore = confidenceScore;
  }

  return apiResponse.success(res, snapshot, 'Latest snapshot retrieved successfully');
});

const getSnapshotHistory = asyncHandler(async (req, res) => {
  const snapshots = await AnalyticsSnapshot.find({ user: req.user._id })
    .sort({ timestamp: -1 });
  return apiResponse.success(res, snapshots, 'Snapshot history retrieved successfully');
});

module.exports = {
  getLatestSnapshot,
  getSnapshotHistory
};
