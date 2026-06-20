const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  getCommunityFailures,
  createCommunityFailure
} = require('../controllers/communityFailureController');
const { createCommunityFailureValidator } = require('../validators/communityFailureValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many anonymous submissions from this IP. Please try again in an hour.'
});

router.route('/')
  .get(getCommunityFailures)
  .post(submitLimiter, createCommunityFailureValidator, validate, createCommunityFailure);

module.exports = router;
