const mongoose = require('mongoose');

const failureReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  interview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: false
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: false
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Role title is required'],
    trim: true
  },
  topic: {
    type: String,
    required: [true, 'Failed topic/concept is required'],
    trim: true
  },
  roundFailed: {
    type: String,
    required: [true, 'Failed round details are required'],
    trim: true
  },
  failedRound: {
    type: String,
    trim: true
  },
  primaryReason: {
    type: String,
    required: [true, 'Primary failure reason is required'],
    trim: true
  },
  secondaryReason: {
    type: String,
    trim: true
  },
  lessonLearned: {
    type: String,
    required: [true, 'Lesson learned must be documented'],
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FailureReport', failureReportSchema);
