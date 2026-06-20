const Skill = require('../models/Skill');
const FailureReport = require('../models/FailureReport');
const CommunityFailureReport = require('../models/CommunityFailureReport');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');

const searchAll = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) {
    return apiResponse.success(res, { skills: [], failures: [], communityFailures: [] });
  }

  const regex = { $regex: q, $options: 'i' };

  const [skills, failures, communityFailures] = await Promise.all([
    Skill.find({ user: req.user._id, name: regex }).select('name masteryScore effectiveScore riskLevel').lean(),
    FailureReport.find({ user: req.user._id, $or: [{ company: regex }, { topic: regex }, { primaryReason: regex }] })
      .select('company role topic roundFailed primaryReason date')
      .sort({ date: -1 })
      .limit(5)
      .lean(),
    CommunityFailureReport.find({ $or: [{ company: regex }, { topic: regex }, { primaryReason: regex }] })
      .select('company role topic roundFailed primaryReason createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  return apiResponse.success(res, { skills, failures, communityFailures });
});

module.exports = { searchAll };
