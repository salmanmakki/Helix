const express = require('express');
const {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill
} = require('../controllers/skillController');
const { protect } = require('../middlewares/auth');
const { createSkillValidator, updateSkillValidator } = require('../validators/skillValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSkills)
  .post(createSkillValidator, validate, createSkill);

router.route('/:id')
  .put(updateSkillValidator, validate, updateSkill)
  .delete(updateSkillValidator, validate, deleteSkill);

module.exports = router;
