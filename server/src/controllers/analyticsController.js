const {
  getDashboardAnalytics,
  getFailuresList,
  getFailedTopics,
  getFailedCompanies,
  getFailedRoles
} = require('../analytics/failureAnalytics');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get dashboard metrics breakdown
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardMetrics = asyncHandler(async (req, res) => {
  const data = await getDashboardAnalytics(req.user._id);
  return apiResponse.success(res, data, 'Dashboard analytics computed');
});

// @desc    Get list of all logged failures
// @route   GET /api/analytics/failures
// @access  Private
const getFailuresAnalyticsList = asyncHandler(async (req, res) => {
  const data = await getFailuresList(req.user._id);
  return apiResponse.success(res, data, 'Failure analytics list retrieved');
});

// @desc    Get topic failure breakdown
// @route   GET /api/analytics/topics
// @access  Private
const getTopicFailures = asyncHandler(async (req, res) => {
  const data = await getFailedTopics(req.user._id);
  return apiResponse.success(res, data, 'Topic weaknesses compiled');
});

// @desc    Get company failure trends
// @route   GET /api/analytics/companies
// @access  Private
const getCompanyFailures = asyncHandler(async (req, res) => {
  const data = await getFailedCompanies(req.user._id);
  return apiResponse.success(res, data, 'Company trends aggregated');
});

// @desc    Get role failure trends
// @route   GET /api/analytics/roles
// @access  Private
const getRoleFailures = asyncHandler(async (req, res) => {
  const data = await getFailedRoles(req.user._id);
  return apiResponse.success(res, data, 'Role trends aggregated');
});

module.exports = {
  getDashboardMetrics,
  getFailuresAnalyticsList,
  getTopicFailures,
  getCompanyFailures,
  getRoleFailures
};
