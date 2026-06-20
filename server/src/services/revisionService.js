const Revision = require('../models/Revision');
const Skill = require('../models/Skill');
const CustomError = require('../utils/CustomError');
const { calculateDecayedScore } = require('../recommendations/decayEngine');

const skillToRevisionType = {
  'DSA': 'LeetCode',
  'leetcode': 'LeetCode',
  'system design': 'MockInterview',
  'oops': 'MockInterview',
  'OOP': 'MockInterview',
  'react': 'ProjectWork',
  'node': 'ProjectWork',
  'DBMS': 'DBMSRevision',
  'OS': 'OSRevision',
  'CN': 'CNRevision',
  'sql': 'Quiz'
};

function inferRevisionType(skillName) {
  if (!skillName) return 'Quiz';
  const key = skillName.trim().toLowerCase();
  for (const [pattern, type] of Object.entries(skillToRevisionType)) {
    if (key === pattern || key.startsWith(pattern)) return type;
  }
  return 'Quiz';
}

class RevisionService {
  async getRevisions(userId, query = {}) {
    const { type, skillId, dateFrom, dateTo, page, limit } = query;
    const filter = { user: userId };

    if (type) filter.revisionType = type;
    if (skillId) filter.skill = skillId;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    let revisionsQuery = Revision.find(filter).populate('skill').sort({ date: -1 });

    if (page && limit) {
      const pageNum = parseInt(page);
      const pageSize = parseInt(limit);
      const skip = (pageNum - 1) * pageSize;
      const [revisions, total] = await Promise.all([
        revisionsQuery.skip(skip).limit(pageSize),
        Revision.countDocuments(filter)
      ]);
      return {
        revisions,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      };
    }

    return await revisionsQuery;
  }

  async getRevision(userId, revisionId) {
    const revision = await Revision.findOne({ _id: revisionId, user: userId }).populate('skill');
    if (!revision) throw new CustomError('Revision not found', 404);
    return revision;
  }

  async createRevision(userId, revisionData) {
    const { skillId, revisionType, score, recallScore, duration, notes, skillName, difficulty } = revisionData;

    const finalScore = recallScore ?? score ?? 80;

    let skill = null;
    if (skillId) {
      skill = await Skill.findOne({ _id: skillId, user: userId });
    } else if (skillName) {
      skill = await Skill.findOne({ name: skillName, user: userId });
      if (!skill) {
        skill = await Skill.create({
          user: userId,
          name: skillName,
          masteryScore: finalScore,
          effectiveScore: finalScore,
          riskLevel: 'low',
          lastRevised: new Date()
        });
      }
    }

    const finalRevisionType = revisionType || (skill ? inferRevisionType(skill.name) : 'Quiz');

    const revision = await Revision.create({
      user: userId,
      skill: skill ? skill._id : undefined,
      revisionType: finalRevisionType,
      score: finalScore,
      recallScore: finalScore,
      duration,
      difficulty: difficulty || 'medium',
      notes,
      date: new Date()
    });

    if (skill) {
      skill.lastRevised = new Date();
      if (finalScore !== undefined) {
        skill.masteryScore = Math.round(skill.masteryScore * 0.6 + finalScore * 0.4);
      }

      const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, difficulty || 'medium');
      skill.effectiveScore = effective;
      skill.decayScore = skill.masteryScore - effective;

      if (skill.effectiveScore < 50) {
        skill.riskLevel = 'high';
      } else if (skill.effectiveScore < 75) {
        skill.riskLevel = 'medium';
      } else {
        skill.riskLevel = 'low';
      }

      await skill.save();
    }

    return revision;
  }

  async updateRevision(userId, revisionId, updateData) {
    const revision = await Revision.findOne({ _id: revisionId, user: userId });
    if (!revision) throw new CustomError('Revision not found', 404);

    const allowedFields = ['score', 'recallScore', 'duration', 'difficulty', 'notes', 'revisionType'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        revision[field] = updateData[field];
        if (field === 'score' || field === 'recallScore') {
          revision.score = updateData[field];
          revision.recallScore = updateData[field];
        }
      }
    }

    await revision.save();

    if (revision.skill && (updateData.score !== undefined || updateData.recallScore !== undefined || updateData.difficulty !== undefined)) {
      const finalScore = updateData.score ?? updateData.recallScore;
      const skill = await Skill.findOne({ _id: revision.skill, user: userId });
      if (skill) {
        const diff = updateData.difficulty || revision.difficulty || 'medium';
        skill.lastRevised = new Date();
        if (finalScore !== undefined) {
          skill.masteryScore = Math.round(skill.masteryScore * 0.6 + finalScore * 0.4);
        }

        const effective = calculateDecayedScore(skill.masteryScore, skill.lastRevised, diff);
        skill.effectiveScore = effective;
        skill.decayScore = skill.masteryScore - effective;

        if (skill.effectiveScore < 50) {
          skill.riskLevel = 'high';
        } else if (skill.effectiveScore < 75) {
          skill.riskLevel = 'medium';
        } else {
          skill.riskLevel = 'low';
        }

        await skill.save();
      }
    }

    return revision;
  }

  async deleteRevision(userId, revisionId) {
    const revision = await Revision.findOneAndDelete({ _id: revisionId, user: userId });
    if (!revision) throw new CustomError('Revision not found', 404);
    return revision;
  }
}

module.exports = new RevisionService();
