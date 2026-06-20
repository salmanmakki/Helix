const express = require('express');
const {
  checkAvailability,
  getInsights,
  getDashboardInsights,
  analyzeAndStoreFailure,
  analyzeText,
  explainRisk,
  generateStudyPlan,
  getSuggestedTasks,
  generateDrill,
  analyzeCommunityFailures,
  analyzeMyFailures,
  chat
} = require('../controllers/ai.controller');
const { protect } = require('../../middlewares/auth');
const {
  insightsValidator,
  explainRiskValidator,
  dashboardInsightsValidator,
  studyPlanValidator,
  analyzeFailureValidator,
  analyzeTextValidator,
  drillValidator,
  chatValidator
} = require('../validators/ai.validator');
const validate = require('../../middlewares/validate');

const router = express.Router();

router.use(protect);
router.use(checkAvailability);

router.post('/insights', insightsValidator, validate, getInsights);
router.get('/dashboard-insights', dashboardInsightsValidator, validate, getDashboardInsights);
router.post('/explain-risk', explainRiskValidator, validate, explainRisk);
router.get('/suggested-tasks', getSuggestedTasks);
router.post('/study-plan', studyPlanValidator, validate, generateStudyPlan);
router.post('/analyze-failure', analyzeFailureValidator, validate, analyzeAndStoreFailure);
router.post('/analyze', analyzeTextValidator, validate, analyzeText);
router.post('/drill', drillValidator, validate, generateDrill);
router.get('/analyze-community-failures', analyzeCommunityFailures);
router.get('/analyze-my-failures', analyzeMyFailures);
router.post('/chat', chatValidator, validate, chat);

module.exports = router;
