const { body, param } = require('express-validator');

const createRevisionValidator = [
  body('revisionType')
    .notEmpty()
    .withMessage('Revision type is required')
    .isString()
    .trim()
    .withMessage('Revision type must be a string'),
  body('score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .toInt()
    .withMessage('Score must be an integer between 0 and 100'),
  body('recallScore')
    .notEmpty()
    .withMessage('Recall score is required')
    .isInt({ min: 0, max: 100 })
    .toInt()
    .withMessage('Recall score must be an integer between 0 and 100'),
  body('duration')
    .notEmpty()
    .withMessage('Duration is required')
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Duration must be a positive integer in minutes'),
  body('skillId')
    .optional()
    .isMongoId()
    .withMessage('Invalid skill identifier format'),
  body('skillName')
    .optional()
    .isString()
    .trim()
    .withMessage('Skill name must be a string'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard')
];

const updateRevisionValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid revision identifier'),
  body('revisionType')
    .optional()
    .isString()
    .trim()
    .withMessage('Revision type must be a string'),
  body('score')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Score must be an integer between 0 and 100'),
  body('recallScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Recall score must be an integer between 0 and 100'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer in minutes'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .withMessage('Notes must be a string')
];

module.exports = {
  createRevisionValidator,
  updateRevisionValidator
};
