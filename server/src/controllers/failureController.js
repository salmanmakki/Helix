const failureService = require('../services/failureService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get current user's failure reports with optional query filters
// @route   GET /api/failures
// @access  Private
const getFailures = asyncHandler(async (req, res) => {
  const { company, role, topic } = req.query;
  const failures = await failureService.getFailures(req.user._id, { company, role, topic });
  return apiResponse.success(res, failures, 'Failure reports retrieved successfully');
});

// @desc    Log a new failure report
// @route   POST /api/failures
// @access  Private
const createFailure = asyncHandler(async (req, res) => {
  const report = await failureService.createFailure(req.user._id, req.body);
  return apiResponse.success(res, report, 'Failure report logged successfully', 201);
});

// @desc    Get current user's failure reports by company name
// @route   GET /api/failures/company/:company
// @access  Private
const getFailuresByCompany = asyncHandler(async (req, res) => {
  const failures = await failureService.getFailuresByCompany(req.user._id, req.params.company);
  return apiResponse.success(res, failures, `Failures for company ${req.params.company} retrieved`);
});

// @desc    Get current user's failure reports by topic name
// @route   GET /api/failures/topic/:topic
// @access  Private
const getFailuresByTopic = asyncHandler(async (req, res) => {
  const failures = await failureService.getFailuresByTopic(req.user._id, req.params.topic);
  return apiResponse.success(res, failures, `Failures for topic ${req.params.topic} retrieved`);
});

// @desc    Delete a failure report
// @route   DELETE /api/failures/:id
// @access  Private
const deleteFailure = asyncHandler(async (req, res) => {
  await failureService.deleteFailure(req.user._id, req.params.id);
  return apiResponse.success(res, null, 'Failure report and associated interview log deleted');
});

module.exports = {
  getFailures,
  createFailure,
  getFailuresByCompany,
  getFailuresByTopic,
  deleteFailure
};
