const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: false,
    index: true
  },
  revisionType: {
    type: String,
    required: [true, 'Revision type is required']
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  date: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number,
    required: [true, 'Revision duration (minutes) is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  recallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Revision', revisionSchema);
