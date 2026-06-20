/**
 * Formats API responses to maintain compatibility with the frontend's expectations.
 * Returns the raw data directly on success, and simple message/error fields on failure.
 */
const apiResponse = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json(data);
  },
  error: (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      message,
      errors
    });
  }
};

module.exports = apiResponse;
