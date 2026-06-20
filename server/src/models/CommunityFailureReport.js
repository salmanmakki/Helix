const mongoose = require('mongoose');

const communityFailureReportSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 120
  },
  role: {
    type: String,
    required: [true, 'Role title is required'],
    trim: true,
    maxlength: 120
  },
  topic: {
    type: String,
    required: [true, 'Failed topic/concept is required'],
    trim: true,
    maxlength: 120
  },
  roundFailed: {
    type: String,
    required: [true, 'Failed round details are required'],
    trim: true,
    maxlength: 120
  },
  primaryReason: {
    type: String,
    required: [true, 'Primary failure reason is required'],
    trim: true,
    maxlength: 500
  },
  secondaryReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  interviewExperience: {
    type: String,
    required: [true, 'Interview experience summary is required'],
    trim: true,
    maxlength: 2000
  },
  lessonLearned: {
    type: String,
    required: [true, 'Lesson learned must be documented'],
    trim: true,
    maxlength: 1000
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CommunityFailureReport', communityFailureReportSchema);
