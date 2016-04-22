var express = require('express');
var router = express.Router();
var taskAPI = require('../user_modules/tasks.api');
var userAPI = require('../user_modules/users.api');

/* Handle tasks */
router.route('/tasks/:task_id')
	.get(taskAPI.getTask)
	.delete(taskAPI.deleteTask)
	.put(taskAPI.putTask);

router.route('/tasks/broadcast/:TaskID')
	.get(taskAPI.broadcastTask);

router.route('/tasks/receive/:Code')
	.get(taskAPI.receiveTask);

router.route('/tasks')
	.get(taskAPI.getTasks)
	.post(taskAPI.createTask);

/* Handle users */

router.route('/user')
	.get(userAPI.userGet)
	.put(userAPI.userUpdate)
	.delete(userAPI.userDelete);

router.route('/users/login')
	.post(userAPI.userLogin);

router.route('/users/create')
	.post(userAPI.userCreate);

router.route('/users/verify')
	.post(userAPI.userVerify);

router.route('/users/recover')
	.post(userAPI.userRecover);

router.route('/users/reset')
	.post(userAPI.userReset);

module.exports = router;
