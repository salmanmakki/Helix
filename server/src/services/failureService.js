const FailureReport = require('../models/FailureReport');
const Interview = require('../models/Interview');
const CustomError = require('../utils/CustomError');

class FailureService {
  /**
   * Get failure reports for a single user (personal analytics).
   */
  async getFailures(userId, { company, role, topic } = {}) {
    const query = { user: userId };
    if (company && company !== 'All Entities') {
      query.company = { $regex: new RegExp(company, 'i') };
    }
    if (role && role !== 'All Roles') {
      query.role = { $regex: new RegExp(role, 'i') };
    }
    if (topic && topic !== 'All Topics') {
      query.topic = { $regex: new RegExp(topic, 'i') };
    }
    return FailureReport.find(query)
      .populate('interview')
      .sort({ date: -1 });
  }

  /**
   * Log a new failure report.
   */
  async createFailure(userId, failureData) {
    const { 
      interviewId, 
      company, 
      role, 
      topic, 
      roundFailed, 
      failedRound, 
      primaryReason, 
      secondaryReason, 
      lessonLearned, 
      date 
    } = failureData;

    let targetInterviewId = interviewId;

    // If an interviewId isn't provided, see if we can locate/create an interview match
    if (!targetInterviewId && company && role) {
      let match = await Interview.findOne({ user: userId, company, role }).sort({ interviewDate: -1 });
      if (!match) {
        match = await Interview.create({
          user: userId,
          company,
          role,
          result: 'failed',
          status: 'failed',
          interviewDate: date || new Date(),
          roundNumber: 3
        });
      } else {
        match.result = 'failed';
        match.status = 'failed';
        await match.save();
      }
      targetInterviewId = match._id;
    } else if (targetInterviewId) {
      // Mark selected interview as failed
      await Interview.findByIdAndUpdate(targetInterviewId, { result: 'failed', status: 'failed' });
    }

    const report = await FailureReport.create({
      user: userId,
      interview: targetInterviewId,
      interviewId: targetInterviewId,
      company: company || 'Mock Interview',
      role: role || 'Software Engineer',
      topic,
      roundFailed: roundFailed || failedRound || 'Round 3: System Design',
      failedRound: failedRound || roundFailed || 'Round 3: System Design',
      primaryReason,
      secondaryReason: secondaryReason || '',
      lessonLearned,
      date: date || new Date()
    });

    return report;
  }

  /**
   * Get current user's failures filtered by company.
   */
  async getFailuresByCompany(userId, company) {
    return FailureReport.find({
      user: userId,
      company: { $regex: new RegExp(company, 'i') }
    })
      .populate('interview')
      .sort({ date: -1 });
  }

  /**
   * Get current user's failures filtered by topic.
   */
  async getFailuresByTopic(userId, topic) {
    return FailureReport.find({
      user: userId,
      topic: { $regex: new RegExp(topic, 'i') }
    })
      .populate('interview')
      .sort({ date: -1 });
  }

  /**
   * Delete a failure report.
   */
  async deleteFailure(userId, failureId) {
    const report = await FailureReport.findOne({ _id: failureId, user: userId });
    if (!report) {
      throw new CustomError('Failure report not found', 404);
    }
    if (report.interview) {
      await Interview.findOneAndDelete({ _id: report.interview, user: userId });
    }
    return await FailureReport.deleteOne({ _id: failureId });
  }
}

module.exports = new FailureService();
