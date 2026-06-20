const { body, param } = require('express-validator');

const createInterviewValidator = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role description is required'),
  body('result')
    .optional()
    .isIn(['passed', 'failed', 'pending'])
    .withMessage('Result must be passed, failed, or pending'),
  body('status')
    .optional()
    .isIn(['passed', 'failed', 'pending'])
    .withMessage('Status must be passed, failed, or pending')
];

const updateInterviewValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid interview identifier'),
  body('company')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty'),
  body('role')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role cannot be empty'),
  body('result')
    .optional()
    .isIn(['passed', 'failed', 'pending'])
    .withMessage('Result must be passed, failed, or pending'),
  body('status')
    .optional()
    .isIn(['passed', 'failed', 'pending'])
    .withMessage('Status must be passed, failed, or pending')
];

module.exports = {
  createInterviewValidator,
  updateInterviewValidator
};
