const mongoose = require('mongoose');

const readinessScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 70
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  },
  threatLevel: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    default: 'medium'
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'critical'],
    default: 'medium'
  },
  highRiskTopics: [{
    type: String,
    trim: true
  }],
  recommendations: [{
    type: String,
    trim: true
  }],
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReadinessScore', readinessScoreSchema);
