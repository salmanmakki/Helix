const Skill = require('../models/Skill');
const { calculateDecayedScore } = require('../recommendations/decayEngine');
const CustomError = require('../utils/CustomError');

class SkillService {
  /**
   * Fetch all skills for a user, recalculating their decayed scores first.
   */
  async getSkills(userId) {
    const skills = await Skill.find({ user: userId });
    
    // Future-ready Redis caching can check keys here
    // const cachedSkills = await redis.get(`skills:${userId}`);
    // if (cachedSkills) return JSON.parse(cachedSkills);

    const updatedSkills = [];
    for (const skill of skills) {
      const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, 'medium');
      skill.effectiveScore = effective;
      skill.decayScore = skill.masteryScore - effective;
      
      if (effective < 50) {
        skill.riskLevel = 'high';
      } else if (effective < 75) {
        skill.riskLevel = 'medium';
      } else {
        skill.riskLevel = 'low';
      }
      
      await skill.save();
      updatedSkills.push(skill);
    }

    // Cache to Redis in the future:
    // await redis.set(`skills:${userId}`, JSON.stringify(updatedSkills), 'EX', 3600);

    return updatedSkills;
  }

  /**
   * Log/Create a new skill.
   */
  async createSkill(userId, skillData) {
    const { name, masteryScore } = skillData;
    
    // Check if duplicate
    const skillExists = await Skill.findOne({ user: userId, name });
    if (skillExists) {
      throw new CustomError('Skill already exists for this user', 400);
    }

    const effective = masteryScore; // Default new skill effective score = mastery score
    
    let riskLevel = 'low';
    if (effective < 50) riskLevel = 'high';
    else if (effective < 75) riskLevel = 'medium';

    const skill = await Skill.create({
      user: userId,
      name,
      masteryScore,
      effectiveScore: effective,
      decayScore: 0,
      riskLevel,
      lastRevised: new Date()
    });

    return skill;
  }

  /**
   * Update a skill (Mastery score or manually setting properties).
   */
  async updateSkill(userId, skillId, skillData) {
    const skill = await Skill.findOne({ _id: skillId, user: userId });
    if (!skill) {
      throw new CustomError('Skill not found', 404);
    }

    if (skillData.masteryScore !== undefined) {
      skill.masteryScore = skillData.masteryScore;
    }
    if (skillData.name !== undefined) {
      skill.name = skillData.name;
    }
    if (skillData.lastRevised !== undefined) {
      skill.lastRevised = skillData.lastRevised;
    }

    const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, 'medium');
    skill.effectiveScore = effective;
    skill.decayScore = skill.masteryScore - effective;

    if (effective < 50) {
      skill.riskLevel = 'high';
    } else if (effective < 75) {
      skill.riskLevel = 'medium';
    } else {
      skill.riskLevel = 'low';
    }

    await skill.save();
    return skill;
  }

  /**
   * Delete a skill entry.
   */
  async deleteSkill(userId, skillId) {
    const result = await Skill.findOneAndDelete({ _id: skillId, user: userId });
    if (!result) {
      throw new CustomError('Skill not found', 404);
    }
    return result;
  }
}

module.exports = new SkillService();
