const express = require('express');
const {
  getNotifications,
  markAsRead,
  clearRead
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');
const { markNotificationReadValidator } = require('../validators/notificationValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.put('/:id/read', markNotificationReadValidator, validate, markAsRead);

router.delete('/read', clearRead);

module.exports = router;
