const ActionPlan = require('../models/ActionPlan');
const Skill = require('../models/Skill');
const Revision = require('../models/Revision');
const { calculateDecayedScore } = require('../recommendations/decayEngine');
const CustomError = require('../utils/CustomError');

const LEGACY_SEEDED_TASKS = new Set([
  'Revise SQL Indexing',
  'Review OS Deadlocks',
  'Practice Scheduling Algorithms'
]);

const isLegacySeededPlan = (plan) => {
  if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    return false;
  }

  return plan.tasks.every((task, index) => {
    const textMatches = LEGACY_SEEDED_TASKS.has(task.text);
    const durationMatches = ['45 mins', '30 mins', '60 mins'].includes(task.duration);
    const difficultyMatches = ['HARD', 'MED'].includes(task.difficulty);
    const orderMatches = task.order === index;
    return textMatches && durationMatches && difficultyMatches && orderMatches;
  });
};

class ActionPlanService {
  async getOrCreatePlan(userId) {
    let plan = await ActionPlan.findOne({ user: userId });
    if (!plan) {
      plan = await ActionPlan.create({
        user: userId,
        tasks: []
      });
    } else if (isLegacySeededPlan(plan)) {
      plan.tasks = [];
      await plan.save();
    }
    return plan;
  }

  async addTask(userId, taskData) {
    const plan = await ActionPlan.findOne({ user: userId });
    if (!plan) throw new CustomError('Action plan not found', 404);

    plan.tasks.unshift({
      text: taskData.text,
      duration: taskData.duration || '30 mins',
      difficulty: taskData.difficulty || 'MED',
      completed: false,
      order: 0
    });

    plan.tasks.forEach((item, idx) => {
      item.order = idx;
    });

    await plan.save();
    return plan;
  }

  async toggleTask(userId, taskId) {
    const plan = await ActionPlan.findOne({ user: userId });
    if (!plan) throw new CustomError('Action plan not found', 404);

    const task = plan.tasks.id(taskId);
    if (!task) throw new CustomError('Task not found', 404);

    const wasCompleted = task.completed;
    task.completed = !task.completed;
    await plan.save();

    let revision = null;

    if (task.completed && !wasCompleted) {
      const skills = await Skill.find({ user: userId }).sort({ decayScore: -1 });
      const taskLower = task.text.toLowerCase();
      const taskWords = taskLower.split(/\s+/);
      const matched = skills.find(s => {
        const nameLower = s.name.toLowerCase();
        return taskLower.includes(nameLower) || taskWords.some(w => w.length > 2 && nameLower.includes(w));
      });

      let effective = 80;
      if (matched) {
        matched.lastRevised = new Date();
        effective = calculateDecayedScore(matched.masteryScore, matched.lastRevised, matched.riskLevel === 'high' ? 'hard' : 'medium');
        matched.effectiveScore = effective;
        matched.decayScore = matched.masteryScore - effective;
        if (effective < 50) matched.riskLevel = 'high';
        else if (effective < 75) matched.riskLevel = 'medium';
        else matched.riskLevel = 'low';
        await matched.save();
      }

      const durationNum = parseInt(task.duration, 10) || 30;
      const difficultyMap = { 'EASY': 'easy', 'MED': 'medium', 'HARD': 'hard' };
      revision = await Revision.create({
        user: userId,
        skill: matched?._id,
        revisionType: 'Quiz',
        score: Math.round(effective),
        duration: durationNum,
        difficulty: difficultyMap[task.difficulty] || 'medium',
        recallScore: Math.round(effective),
        date: new Date(),
        notes: `Completed from action plan: ${task.text}`
      });
    }

    return { plan, revision };
  }

  async updateTask(userId, taskId, updateData) {
    const plan = await ActionPlan.findOne({ user: userId });
    if (!plan) throw new CustomError('Action plan not found', 404);

    const currentIndex = plan.tasks.findIndex((task) => task._id.toString() === taskId.toString());
    if (currentIndex === -1) throw new CustomError('Task not found', 404);

    const task = plan.tasks[currentIndex];

    if (updateData.text !== undefined) task.text = updateData.text;
    if (updateData.duration !== undefined) task.duration = updateData.duration;
    if (updateData.difficulty !== undefined) task.difficulty = updateData.difficulty;
    if (updateData.completed !== undefined) task.completed = updateData.completed;
    if (updateData.order !== undefined) {
      const requestedIndex = Math.max(0, Math.min(Number.parseInt(updateData.order, 10) || 0, plan.tasks.length - 1));
      const [movedTask] = plan.tasks.splice(currentIndex, 1);
      plan.tasks.splice(requestedIndex, 0, movedTask);
      plan.tasks.forEach((item, idx) => {
        item.order = idx;
      });
    }

    await plan.save();
    return plan;
  }

  async deleteTask(userId, taskId) {
    const plan = await ActionPlan.findOne({ user: userId });
    if (!plan) throw new CustomError('Action plan not found', 404);

    const task = plan.tasks.id(taskId);
    if (!task) throw new CustomError('Task not found', 404);

    task.deleteOne();
    await plan.save();
    return plan;
  }
}

module.exports = new ActionPlanService();
