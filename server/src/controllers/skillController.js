const skillService = require('../services/skillService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

// @desc    Get all skills with real-time decay calculated
// @route   GET /api/skills
// @access  Private
const getSkills = asyncHandler(async (req, res) => {
  const skills = await skillService.getSkills(req.user._id);
  return apiResponse.success(res, skills, 'Skills retrieved successfully');
});

// @desc    Create a new skill
// @route   POST /api/skills
// @access  Private
const createSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.createSkill(req.user._id, req.body);
  return apiResponse.success(res, skill, 'Skill created successfully', 201);
});

// @desc    Update a skill
// @route   PUT /api/skills/:id
// @access  Private
const updateSkill = asyncHandler(async (req, res) => {
  const skill = await skillService.updateSkill(req.user._id, req.params.id, req.body);
  return apiResponse.success(res, skill, 'Skill updated successfully');
});

// @desc    Delete a skill
// @route   DELETE /api/skills/:id
// @access  Private
const deleteSkill = asyncHandler(async (req, res) => {
  await skillService.deleteSkill(req.user._id, req.params.id);
  return apiResponse.success(res, null, 'Skill deleted successfully');
});

module.exports = {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
};
