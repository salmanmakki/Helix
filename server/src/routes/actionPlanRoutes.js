const express = require('express');
const { getPlan, addTask, toggleTask, updateTask, deleteTask } = require('../controllers/actionPlanController');
const { protect } = require('../middlewares/auth');
const { createTaskValidator, updateTaskValidator } = require('../validators/actionPlanValidator');
const validate = require('../middlewares/validate');

const router = express.Router();

router.use(protect);

router.get('/', getPlan);

router.post('/tasks', createTaskValidator, validate, addTask);

router.patch('/tasks/:taskId/toggle', updateTaskValidator, validate, toggleTask);

router.put('/tasks/:taskId', updateTaskValidator, validate, updateTask);

router.delete('/tasks/:taskId', updateTaskValidator, validate, deleteTask);

module.exports = router;
