var express = require('express');
var router = express.Router();
var taskAPI = require('../user_modules/tasks.api');

/* GET single task listing. */
router.route('/tasks/:task_id')
	.get(taskAPI.getTask)
	.delete(taskAPI.deleteTask)
	.put(taskAPI.putTask);

/* GET all user task listing. */
router.route('/tasks')
	.get(taskAPI.getTasks)
	.post(taskAPI.createTask);

module.exports = router;
