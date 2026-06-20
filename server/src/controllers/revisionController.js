const revisionService = require('../services/revisionService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

const getRevisions = asyncHandler(async (req, res) => {
  const result = await revisionService.getRevisions(req.user._id, req.query);
  return apiResponse.success(res, result, 'Revisions retrieved successfully');
});

const getRevision = asyncHandler(async (req, res) => {
  const revision = await revisionService.getRevision(req.user._id, req.params.id);
  return apiResponse.success(res, revision, 'Revision retrieved successfully');
});

const logRevision = asyncHandler(async (req, res) => {
  const revision = await revisionService.createRevision(req.user._id, req.body);
  return apiResponse.success(res, revision, 'Revision logged successfully', 201);
});

const updateRevision = asyncHandler(async (req, res) => {
  const revision = await revisionService.updateRevision(req.user._id, req.params.id, req.body);
  return apiResponse.success(res, revision, 'Revision updated successfully');
});

const deleteRevision = asyncHandler(async (req, res) => {
  await revisionService.deleteRevision(req.user._id, req.params.id);
  return apiResponse.success(res, null, 'Revision deleted successfully');
});

const getUserRevisions = asyncHandler(async (req, res) => {
  const result = await revisionService.getRevisions(req.user._id, req.query);
  return apiResponse.success(res, result, 'User revisions retrieved successfully');
});

module.exports = {
  getRevisions,
  getRevision,
  logRevision,
  updateRevision,
  deleteRevision,
  getUserRevisions
};
