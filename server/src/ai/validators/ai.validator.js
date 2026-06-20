const { body } = require('express-validator');

const insightsValidator = [];

const explainRiskValidator = [];

const dashboardInsightsValidator = [];

const studyPlanValidator = [
  body('targetCompany')
    .trim()
    .notEmpty()
    .withMessage('Target company is required'),
  body('targetRole')
    .trim()
    .notEmpty()
    .withMessage('Target role is required'),
  body('daysAvailable')
    .notEmpty()
    .withMessage('Days available is required')
    .isInt({ min: 1, max: 90 })
    .withMessage('Days available must be between 1 and 90')
    .toInt()
];

const analyzeTextValidator = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Text is required for analysis')
    .isLength({ min: 10 })
    .withMessage('Text must be at least 10 characters')
];

const analyzeFailureValidator = [
  body('notes')
    .trim()
    .notEmpty()
    .withMessage('Interview notes are required for failure analysis')
    .isLength({ min: 20 })
    .withMessage('Interview notes must be at least 20 characters'),
  body('interviewId')
    .optional()
    .isMongoId()
    .withMessage('Invalid interview identifier')
];

const drillValidator = [
  body('skillName')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard')
];

const chatValidator = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
];

module.exports = {
  insightsValidator,
  explainRiskValidator,
  dashboardInsightsValidator,
  studyPlanValidator,
  analyzeTextValidator,
  analyzeFailureValidator,
  drillValidator,
  chatValidator
};
