const interviewService = require('../services/interviewService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get all interviews for a user
// @route   GET /api/interviews
// @access  Private
const getInterviews = asyncHandler(async (req, res) => {
  const interviews = await interviewService.getInterviews(req.user._id);
  return apiResponse.success(res, interviews, 'Interviews retrieved successfully');
});

// @desc    Create a new interview
// @route   POST /api/interviews
// @access  Private
const createInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.createInterview(req.user._id, req.body);
  return apiResponse.success(res, interview, 'Interview created successfully', 201);
});

// @desc    Update an interview
// @route   PUT /api/interviews/:id
// @access  Private
const updateInterview = asyncHandler(async (req, res) => {
  const interview = await interviewService.updateInterview(req.user._id, req.params.id, req.body);
  return apiResponse.success(res, interview, 'Interview updated successfully');
});

// @desc    Delete an interview
// @route   DELETE /api/interviews/:id
// @access  Private
const deleteInterview = asyncHandler(async (req, res) => {
  await interviewService.deleteInterview(req.user._id, req.params.id);
  return apiResponse.success(res, null, 'Interview deleted successfully');
});

module.exports = {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview
};
