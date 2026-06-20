const express = require('express');
const {
  getDashboardMetrics,
  getFailuresAnalyticsList,
  getTopicFailures,
  getCompanyFailures,
  getRoleFailures
} = require('../controllers/analyticsController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardMetrics);
router.get('/failures', getFailuresAnalyticsList);
router.get('/topics', getTopicFailures);
router.get('/companies', getCompanyFailures);
router.get('/roles', getRoleFailures);

module.exports = router;
