const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  masteryScore: {
    type: Number,
    required: true,
    min: [0, 'Mastery score cannot be negative'],
    max: [100, 'Mastery score cannot exceed 100'],
    default: 80
  },
  lastRevised: {
    type: Date,
    default: Date.now
  },
  effectiveScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  decayScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Ensure a user cannot duplicate skill entries
skillSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
