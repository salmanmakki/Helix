const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['EASY', 'MED', 'HARD'],
    default: 'MED'
  },
  completed: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const actionPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },
  tasks: [taskSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('ActionPlan', actionPlanSchema);
