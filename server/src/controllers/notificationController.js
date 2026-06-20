const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user._id);
  return apiResponse.success(res, notifications, 'Notifications retrieved successfully');
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user._id, req.params.id);
  return apiResponse.success(res, notification, 'Notification marked as read');
});

const clearRead = asyncHandler(async (req, res) => {
  await notificationService.clearRead(req.user._id);
  return apiResponse.success(res, null, 'Read notifications cleared');
});

module.exports = {
  getNotifications,
  markAsRead,
  clearRead
};
