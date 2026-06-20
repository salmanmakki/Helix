const mongoose = require('mongoose');
const FailureReport = require('../models/FailureReport');

/**
 * Computes failure metrics across topics, rounds, companies, and roles.
 * @param {string} userId - User identifier
 * @returns {Promise<object>} analytics object: { mostFailedTopics, mostFailedRounds, companyTrends, roleTrends }
 */
const getFailureAnalytics = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 1. Most Failed Topics
  const mostFailedTopics = await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { topic: '$_id', count: 1, _id: 0 } }
  ]);

  // 2. Most Failed Rounds (Choke Points)
  const mostFailedRounds = await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$roundFailed', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { round: '$_id', count: 1, _id: 0 } }
  ]);

  // 3. Company Trends
  const companyTrends = await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$company', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { company: '$_id', count: 1, _id: 0 } }
  ]);

  // 4. Role Trends
  const roleTrends = await FailureReport.aggregate([
    { $match: { user: userObjectId } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { role: '$_id', count: 1, _id: 0 } }
  ]);

  return {
    mostFailedTopics,
    mostFailedRounds,
    companyTrends,
    roleTrends
  };
};

module.exports = {
  getFailureAnalytics
};
