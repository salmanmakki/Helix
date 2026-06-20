const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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
  date: {
    type: Date,
    default: Date.now
  },
  interviewDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['passed', 'failed', 'pending'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['passed', 'failed', 'pending'],
    default: 'pending'
  },
  roundNumber: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Interview', interviewSchema);
