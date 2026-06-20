const communityFailureService = require('../services/communityFailureService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get anonymous community failure reports
// @route   GET /api/community-failures
// @access  Public
const getCommunityFailures = asyncHandler(async (req, res) => {
  const { company, role, topic, limit } = req.query;
  const reports = await communityFailureService.getReports({
    company,
    role,
    topic,
    limit: limit ? parseInt(limit, 10) : undefined
  });
  return apiResponse.success(res, reports, 'Community failure reports retrieved successfully');
});

// @desc    Submit an anonymous community failure report
// @route   POST /api/community-failures
// @access  Public
const createCommunityFailure = asyncHandler(async (req, res) => {
  const report = await communityFailureService.createReport(req.body);
  return apiResponse.success(res, report, 'Anonymous failure report submitted successfully', 201);
});

module.exports = {
  getCommunityFailures,
  createCommunityFailure
};
