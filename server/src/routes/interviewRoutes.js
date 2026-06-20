const express = require('express');
const {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview
} = require('../controllers/interviewController');
const { protect } = require('../middlewares/auth');
const { createInterviewValidator, updateInterviewValidator } = require('../validators/interviewValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInterviews)
  .post(createInterviewValidator, validate, createInterview);

router.route('/:id')
  .put(updateInterviewValidator, validate, updateInterview)
  .delete(updateInterviewValidator, validate, deleteInterview);

module.exports = router;
