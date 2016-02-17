var express = require('express');
var router = express.Router();
var taskAPI = require('../user_modules/tasks');

/* GET single task listing. */
router.get('/tasks/:tid', function(req, res, next) {
	if (!req.session.uid) {
		res.send({error: 'authfailure'});
		return;
	}

	var params = {
		uid: req.session.uid,
		tid: req.params.tid
	};

	taskAPI.getTask(params, function (err, result) {
		if (err) {
  		res.send({error: err});
			return;
		}
  	res.send({result: result});
	});
});

/* GET all user task listing. */
router.get('/tasks', function(req, res, next) {
	if (!req.session.uid) {
		res.send({error: 'authfailure'});
		return;
	}

	var params = {
		uid: req.session.uid,
	};

	taskAPI.getTasks(params, function (err, result) {
		if (err) {
  		res.send({error: err});
			return;
		}
  	res.send({result: result});
	});
});

module.exports = router;
