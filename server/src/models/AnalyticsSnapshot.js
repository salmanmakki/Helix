const mongoose = require('mongoose');

const analyticsSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  efficiencyRate: {
    type: Number,
    required: true,
    default: 0
  },
  failureRate: {
    type: Number,
    required: true,
    default: 0
  },
  decayRate: {
    type: Number,
    required: true,
    default: 0
  },
  readinessScore: {
    type: Number,
    required: true,
    default: 0
  },
  riskScore: {
    type: Number,
    required: true,
    default: 0
  },
  streak: {
    type: Number,
    required: true,
    default: 0
  },
  confidenceScore: {
    type: Number,
    required: true,
    default: 50
  },
  confidenceLevel: {
    type: String,
    required: true,
    default: 'MEDIUM'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema);
