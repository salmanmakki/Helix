const cron = require('node-cron');
const User = require('../models/User');
const { calculateReadiness } = require('../recommendations/readinessEngine');
const { runRiskDiagnostic } = require('../recommendations/riskEngine');
const { getDashboardAnalytics } = require('../analytics/failureAnalytics');
const { computeStreak } = require('../services/streakService');
const { computeConfidence } = require('../services/confidenceService');
const ReadinessScore = require('../models/ReadinessScore');
const AnalyticsSnapshot = require('../models/AnalyticsSnapshot');
const Notification = require('../models/Notification');

// Initialize daily readiness and metrics logging job (runs at 0:05 AM every day: '5 0 * * *')
const initReadinessJob = () => {
  cron.schedule('5 0 * * *', async () => {
    console.log('[Cron] Initializing daily user readiness index calculations and snapshot creation...');
    try {
      const users = await User.find({});
      let count = 0;

      for (const user of users) {
        // 1. Recalculate readiness
        const data = await calculateReadiness(user._id);

        // Record history entry for charting
        await ReadinessScore.create({
          user: user._id,
          overallScore: data.overallScore,
          score: data.overallScore,
          threatLevel: data.threatLevel,
          riskLevel: data.threatLevel,
          recommendations: data.recommendations
        });

        // 2. Fetch dashboard analytics for snapshots
        const analytics = await getDashboardAnalytics(user._id);
        const efficiencyVal = parseFloat(analytics.efficiencyRate) || 80;
        const failureVal = parseFloat(analytics.failureRate) || 0;
        const decayVal = parseFloat(analytics.decayRate) || 0;

        // 3. Run diagnostic for riskScore
        const diagnostics = await runRiskDiagnostic(user._id);
        const criticalCount = diagnostics.criticalRisks.length;
        const riskVal = criticalCount > 0 ? (criticalCount / (diagnostics.allModules.length || 1)) * 100 : 14.2;

        // 4. Compute streak and confidence
        const [streak, { confidenceScore, confidenceLevel }] = await Promise.all([
          computeStreak(user._id),
          computeConfidence(user._id)
        ]);

        // 5. Save daily telemetry snapshot
        await AnalyticsSnapshot.create({
          user: user._id,
          efficiencyRate: efficiencyVal,
          failureRate: failureVal,
          decayRate: decayVal,
          readinessScore: data.overallScore,
          riskScore: riskVal,
          streak,
          confidenceScore,
          confidenceLevel
        });

        // 6. Generate warning notifications if threat level is critical
        if (data.threatLevel === 'critical') {
          await Notification.create({
            user: user._id,
            title: 'Critical Threat Alert',
            message: 'Your overall readiness index has dropped below 60%. Please schedule urgent revision mock reviews.',
            type: 'alert'
          });
        }

        count++;
      }

      console.log(`[Cron] Completed daily telemetry sync. Logged status snapshots for ${count} users.`);
    } catch (error) {
      console.error(`[Cron Error] Telemetry snapshot cron error: ${error.message}`);
    }
  });
};

module.exports = { initReadinessJob };
