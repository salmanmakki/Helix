const { body } = require('express-validator');

const createCommunityFailureValidator = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company is required')
    .isLength({ max: 120 })
    .withMessage('Company name is too long'),
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ max: 120 })
    .withMessage('Role title is too long'),
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('Failed topic is required')
    .isLength({ max: 120 })
    .withMessage('Topic is too long'),
  body('roundFailed')
    .trim()
    .notEmpty()
    .withMessage('Failed round is required')
    .isLength({ max: 120 })
    .withMessage('Round details are too long'),
  body('primaryReason')
    .trim()
    .notEmpty()
    .withMessage('Primary failure reason is required')
    .isLength({ max: 500 })
    .withMessage('Primary reason is too long'),
  body('secondaryReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Secondary reason is too long'),
  body('interviewExperience')
    .trim()
    .notEmpty()
    .withMessage('Interview experience is required')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Interview experience must be between 20 and 2000 characters'),
  body('lessonLearned')
    .trim()
    .notEmpty()
    .withMessage('Lesson learned is required')
    .isLength({ max: 1000 })
    .withMessage('Lesson learned is too long')
];

module.exports = {
  createCommunityFailureValidator
};
