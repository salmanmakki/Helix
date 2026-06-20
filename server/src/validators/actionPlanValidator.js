const { body, param } = require('express-validator');

const createTaskValidator = [
  body('text')
    .notEmpty()
    .withMessage('Task text is required')
    .isString()
    .trim(),
  body('duration')
    .optional()
    .isString()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['EASY', 'MED', 'HARD'])
    .withMessage('Difficulty must be EASY, MED, or HARD')
];

const updateTaskValidator = [
  param('taskId')
    .isMongoId()
    .withMessage('Invalid task identifier'),
  body('text')
    .optional()
    .isString()
    .trim(),
  body('duration')
    .optional()
    .isString()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['EASY', 'MED', 'HARD'])
    .withMessage('Difficulty must be EASY, MED, or HARD'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean')
  ,
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
];

module.exports = {
  createTaskValidator,
  updateTaskValidator
};
