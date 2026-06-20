const express = require('express');
const { getRevisions, getRevision, logRevision, updateRevision, deleteRevision, getUserRevisions } = require('../controllers/revisionController');
const { protect } = require('../middlewares/auth');
const { createRevisionValidator, updateRevisionValidator } = require('../validators/revisionValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRevisions)
  .post(createRevisionValidator, validate, logRevision);

router.get('/user', getUserRevisions);

router.route('/:id')
  .get(updateRevisionValidator, validate, getRevision)
  .put(updateRevisionValidator, validate, updateRevision)
  .delete(updateRevisionValidator, validate, deleteRevision);

module.exports = router;
