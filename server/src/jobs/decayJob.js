const cron = require('node-cron');
const Skill = require('../models/Skill');
const { calculateDecayedScore } = require('../recommendations/decayEngine');

// Initialize daily decay job (runs at midnight every day: '0 0 * * *')
const initDecayJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Initializing daily skill decay calculations...');
    try {
      const skills = await Skill.find({});
      let updatedCount = 0;

      for (const skill of skills) {
        // Compute decayed score
        const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, 'medium');
        
        if (skill.effectiveScore !== effective) {
          skill.effectiveScore = effective;

          // Recalibrate riskLevel
          if (effective < 50) {
            skill.riskLevel = 'high';
          } else if (effective < 75) {
            skill.riskLevel = 'medium';
          } else {
            skill.riskLevel = 'low';
          }

          await skill.save();
          updatedCount++;
        }
      }

      console.log(`[Cron] Completed decay updates. Recalculated scores for ${updatedCount} out of ${skills.length} skills.`);
    } catch (error) {
      console.error(`[Cron Error] Skill decay cron error: ${error.message}`);
    }
  });
};

module.exports = { initDecayJob };
