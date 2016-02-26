var express = require('express');
var router = express.Router();
var taskAPI = require('../user_modules/tasks.api');
var userAPI = require('../user_modules/users.api');

/* GET single task listing. */
router.route('/tasks/:task_id')
	.get(taskAPI.getTask)
	.delete(taskAPI.deleteTask)
	.put(taskAPI.putTask);

/* GET all user task listing. */
router.route('/tasks')
	.get(taskAPI.getTasks)
	.post(taskAPI.createTask);

router.route('/users/login')
	.post(userAPI.userLogin);

router.route('/users/create')
	.post(userAPI.userCreate);

router.route('/users/verify')
	.post(userAPI.userVerify);

module.exports = router;
