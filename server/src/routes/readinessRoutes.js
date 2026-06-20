const express = require('express');
const {
  getReadiness,
  getReadinessHistory,
  recalculateReadiness
} = require('../controllers/readinessController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getReadiness);
router.get('/history', getReadinessHistory);
router.post('/recalculate', recalculateReadiness);

module.exports = router;
