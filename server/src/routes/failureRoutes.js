const express = require('express');
const {
  getFailures,
  createFailure,
  getFailuresByCompany,
  getFailuresByTopic,
  deleteFailure
} = require('../controllers/failureController');
const { protect } = require('../middlewares/auth');
const {
  createFailureValidator,
  deleteFailureValidator,
  companyParamValidator,
  topicParamValidator
} = require('../validators/failureValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFailures)
  .post(createFailureValidator, validate, createFailure);

router.get('/company/:company', companyParamValidator, validate, getFailuresByCompany);
router.get('/topic/:topic', topicParamValidator, validate, getFailuresByTopic);

router.route('/:id')
  .delete(deleteFailureValidator, validate, deleteFailure);

module.exports = router;
