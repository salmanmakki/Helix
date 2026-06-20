const { body, param } = require('express-validator');

const createFailureValidator = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company is required'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required'),
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Failed topic is required'),
  body('roundFailed')
    .trim()
    .notEmpty()
    .withMessage('Failed round is required'),
  body('primaryReason')
    .trim()
    .notEmpty()
    .withMessage('Primary reason is required'),
  body('lessonLearned')
    .trim()
    .notEmpty()
    .withMessage('Lesson learned documentation is required'),
  body('interviewId')
    .optional()
    .isMongoId()
    .withMessage('Invalid interview identifier format')
];

const deleteFailureValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid failure report identifier')
];

const companyParamValidator = [
  param('company')
    .trim()
    .notEmpty()
    .withMessage('Company parameter is required')
];

const topicParamValidator = [
  param('topic')
    .trim()
    .notEmpty()
    .withMessage('Topic parameter is required')
];

module.exports = {
  createFailureValidator,
  deleteFailureValidator,
  companyParamValidator,
  topicParamValidator
};
