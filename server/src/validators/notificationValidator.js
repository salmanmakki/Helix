const { param } = require('express-validator');

const markNotificationReadValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification identifier')
];

module.exports = {
  markNotificationReadValidator
};