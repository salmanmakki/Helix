const { body, param } = require('express-validator');

const createSkillValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required'),
  body('masteryScore')
    .notEmpty()
    .withMessage('Mastery score is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Mastery score must be an integer between 0 and 100')
];

const updateSkillValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid skill identifier'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Skill name cannot be empty'),
  body('masteryScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Mastery score must be an integer between 0 and 100')
];

module.exports = {
  createSkillValidator,
  updateSkillValidator
};
