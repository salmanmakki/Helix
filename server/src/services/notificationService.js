const Notification = require('../models/Notification');
const CustomError = require('../utils/CustomError');

class NotificationService {
  /**
   * Fetch user notifications.
   */
  async getNotifications(userId) {
    return await Notification.find({ user: userId }).sort({ createdAt: -1 });
  }

  /**
   * Create a notification.
   */
  async createNotification(userId, title, message, type = 'info') {
    return await Notification.create({
      user: userId,
      title,
      message,
      type
    });
  }

  /**
   * Mark notification as read.
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      throw new CustomError('Notification not found', 404);
    }
    return notification;
  }

  /**
   * Clear all read notifications for a user.
   */
  async clearRead(userId) {
    return await Notification.deleteMany({ user: userId, read: true });
  }
}

module.exports = new NotificationService();
