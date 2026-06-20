const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

/**
 * Middleware wrapper to validate request parameters using express-validator schema results.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.error(res, 'Validation Error', 400, errors.array());
  }
  next();
};

module.exports = validate;
