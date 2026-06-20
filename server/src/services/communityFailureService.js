const CommunityFailureReport = require('../models/CommunityFailureReport');

class CommunityFailureService {
  async getReports({ company, role, topic, limit = 50 } = {}) {
    const query = {};

    if (company && company !== 'All Entities') {
      query.company = { $regex: new RegExp(company, 'i') };
    }
    if (role && role !== 'All Roles') {
      query.role = { $regex: new RegExp(role, 'i') };
    }
    if (topic && topic !== 'All Topics') {
      query.topic = { $regex: new RegExp(topic, 'i') };
    }

    return CommunityFailureReport.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100));
  }

  async createReport(reportData) {
    const {
      company,
      role,
      topic,
      roundFailed,
      primaryReason,
      secondaryReason,
      interviewExperience,
      lessonLearned,
      date
    } = reportData;

    return CommunityFailureReport.create({
      company,
      role,
      topic,
      roundFailed,
      primaryReason,
      secondaryReason: secondaryReason || '',
      interviewExperience,
      lessonLearned,
      date: date || new Date()
    });
  }
}

module.exports = new CommunityFailureService();
