const express = require('express');
const {
  getLatestSnapshot,
  getSnapshotHistory
} = require('../controllers/analyticsSnapshotController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/latest', getLatestSnapshot);
router.get('/history', getSnapshotHistory);

module.exports = router;
