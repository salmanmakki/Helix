const actionPlanService = require('../services/actionPlanService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

const getPlan = asyncHandler(async (req, res) => {
  const plan = await actionPlanService.getOrCreatePlan(req.user._id);
  return apiResponse.success(res, plan, 'Action plan retrieved successfully');
});

const addTask = asyncHandler(async (req, res) => {
  const plan = await actionPlanService.addTask(req.user._id, req.body);
  return apiResponse.success(res, plan, 'Task added successfully', 201);
});

const toggleTask = asyncHandler(async (req, res) => {
  const result = await actionPlanService.toggleTask(req.user._id, req.params.taskId);
  return apiResponse.success(res, result, 'Task toggled successfully');
});

const updateTask = asyncHandler(async (req, res) => {
  const plan = await actionPlanService.updateTask(req.user._id, req.params.taskId, req.body);
  return apiResponse.success(res, plan, 'Task updated successfully');
});

const deleteTask = asyncHandler(async (req, res) => {
  const plan = await actionPlanService.deleteTask(req.user._id, req.params.taskId);
  return apiResponse.success(res, plan, 'Task deleted successfully');
});

module.exports = {
  getPlan,
  addTask,
  toggleTask,
  updateTask,
  deleteTask
};
