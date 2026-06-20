const { runRiskDiagnostic } = require('../recommendations/riskEngine');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');

// @desc    Perform a comprehensive real-time diagnostic risk scan
// @route   GET /api/risk
// @access  Private
const runRiskScan = asyncHandler(async (req, res) => {
  const diagnostic = await runRiskDiagnostic(req.user._id);
  const criticalCount = diagnostic.criticalRisks.filter(r => r.status === 'critical').length;
  const decayModules = diagnostic.allModules.filter(m => m.status === 'CRITICAL').length;

  if (diagnostic.threatLevel === 'critical' || criticalCount > 0 || decayModules > 0) {
    const title = diagnostic.threatLevel === 'critical'
      ? 'Critical Risk Alert'
      : 'High Risk / Decay Detected';
    let message = '';
    if (criticalCount > 0) message += `${criticalCount} skill(s) at critical risk level. `;
    if (decayModules > 0) message += `${decayModules} module(s) showing active cognitive decay. `;
    if (diagnostic.probabilityOfFailure > 60) message += `Probability of failure: ${diagnostic.probabilityOfFailure}%. `;
    message += 'Immediate attention recommended.';
    await notificationService.createNotification(req.user._id, title, message, 'alert');
  }

  return apiResponse.success(res, diagnostic, 'Risk scan diagnostics completed');
});

// @desc    Retrieve only high/critical risk skills
// @route   GET /api/risk/high
// @access  Private
const getHighRisks = asyncHandler(async (req, res) => {
  const diagnostic = await runRiskDiagnostic(req.user._id);
  return apiResponse.success(res, diagnostic.criticalRisks, 'High risk indicators retrieved');
});

// @desc    Retrieve personalized risk study recommendations
// @route   GET /api/risk/recommendations
// @access  Private
const getRiskRecommendations = asyncHandler(async (req, res) => {
  const diagnostic = await runRiskDiagnostic(req.user._id);
  return apiResponse.success(res, diagnostic.recommendations, 'Risk recommendations retrieved');
});

module.exports = {
  runRiskScan,
  getHighRisks,
  getRiskRecommendations
};
