const Interview = require('../models/Interview');
const CustomError = require('../utils/CustomError');

class InterviewService {
  /**
   * Get all interviews for a user.
   */
  async getInterviews(userId) {
    return await Interview.find({ user: userId }).sort({ interviewDate: -1 });
  }

  /**
   * Create a new interview entry.
   */
  async createInterview(userId, interviewData) {
    const { company, role, result, status, interviewDate, roundNumber, notes } = interviewData;

    return await Interview.create({
      user: userId,
      company,
      role,
      result: result || status || 'pending',
      status: status || result || 'pending',
      interviewDate: interviewDate || new Date(),
      roundNumber: roundNumber || 1,
      notes: notes || ''
    });
  }

  /**
   * Update an interview.
   */
  async updateInterview(userId, interviewId, updateData) {
    const interview = await Interview.findOne({ _id: interviewId, user: userId });
    if (!interview) {
      throw new CustomError('Interview not found', 404);
    }

    const fields = ['company', 'role', 'result', 'status', 'interviewDate', 'roundNumber', 'notes'];
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'result' || field === 'status') {
          interview.result = updateData[field];
          interview.status = updateData[field];
        } else {
          interview[field] = updateData[field];
        }
      }
    });

    return await interview.save();
  }

  /**
   * Delete an interview.
   */
  async deleteInterview(userId, interviewId) {
    const result = await Interview.findOneAndDelete({ _id: interviewId, user: userId });
    if (!result) {
      throw new CustomError('Interview not found', 404);
    }
    return result;
  }
}

module.exports = new InterviewService();
