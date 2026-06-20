const express = require('express');
const {
  runRiskScan,
  getHighRisks,
  getRiskRecommendations
} = require('../controllers/riskController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', runRiskScan);
router.get('/high', getHighRisks);
router.get('/recommendations', getRiskRecommendations);

module.exports = router;
