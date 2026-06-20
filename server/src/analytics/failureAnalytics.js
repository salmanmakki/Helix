const mongoose = require('mongoose');
const FailureReport = require('../models/FailureReport');
const Skill = require('../models/Skill');
const Revision = require('../models/Revision');
const ReadinessScore = require('../models/ReadinessScore');

/**
 * Get aggregate dashboard telemetry data.
 */
const getDashboardAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Calculate preparation efficiency (average skill mastery score)
  const skills = await Skill.find({ user: userId });
  const avgMastery = skills.length > 0
    ? skills.reduce((acc, s) => acc + s.masteryScore, 0) / skills.length
    : 0;

  // 2. Real failure rate from logged failures versus revisions
  const totalFailures = await FailureReport.countDocuments({ user: userId });
  const totalRevisions = await Revision.countDocuments({ user: userId });
  const failureRate = (totalFailures + totalRevisions) > 0
    ? (totalFailures / (totalFailures + totalRevisions)) * 100
    : 0;

  // 3. Knowledge decay rate (average gap in days since last revised)
  const now = new Date();
  const decayGaps = skills.map(s => {
    const diffTime = Math.abs(now - new Date(s.lastRevised));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });
  const avgDecayRate = decayGaps.length > 0 
    ? decayGaps.reduce((acc, gap) => acc + gap, 0) / decayGaps.length 
    : 0;

  // 4. Topic weaknesses
  const topicWeaknesses = await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { topic: '$_id', risk: { $multiply: ['$count', 15] }, _id: 0 } }
  ]);

  return {
    efficiencyRate: `${avgMastery.toFixed(1)}%`,
    failureRate: `${failureRate.toFixed(1)}%`,
    decayRate: `${avgDecayRate.toFixed(1)}d`,
    topicWeaknesses: topicWeaknesses.slice(0, 3)
  };
};

/**
 * Get failure records.
 */
const getFailuresList = async (userId) => {
  return await FailureReport.find({ user: userId }).sort({ date: -1 });
};

/**
 * Get most failed topics.
 */
const getFailedTopics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { name: '$_id', count: 1, _id: 0 } }
  ]);
};

/**
 * Get company failure trends.
 */
const getFailedCompanies = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$company', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { company: '$_id', count: 1, _id: 0 } }
  ]);
};

/**
 * Get role failure trends.
 */
const getFailedRoles = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  return await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { role: '$_id', count: 1, _id: 0 } }
  ]);
};

module.exports = {
  getDashboardAnalytics,
  getFailuresList,
  getFailedTopics,
  getFailedCompanies,
  getFailedRoles
};
