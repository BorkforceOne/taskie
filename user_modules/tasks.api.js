/*
 * tasks.api.js
 *
 * Simple API procedures that will call functions
 * from tasks.js to accomplish their goals. Also
 * ensures users are authenticated prior to running
 * any tasks.js code.
 */

console.log("Loading tasks.api.js");

var tasks = require('./tasks.js');

/**
 * Attempts to get a single task. Sends the
 * result back to the client as a HTTP JSON object.
 */
var getTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		uid: req.session.user.UserID,
		tid: req.params.task_id
	};
	
	tasks.getTask(params, function (err, result) {
		return res.json(result);
	});
};

/**
 * Attempts to delete a single task. Sends the
 * result back to the client as a HTTP JSON object.
 */
var deleteTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		uid: req.session.user.UserID,
		tid: req.params.task_id
	};
	
	tasks.deleteTask(params, function (err, result) {
		return res.json(result);
	});
};

/**
 * Attempts to create a single task. Sends the
 * result back to the client as a HTTP JSON object.
 */
var createTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		uid: req.session.user.UserID,
		task_title: req.body.title,
		task_desc: req.body.desc,
		task_parent_id: req.body.parent_id,
		task_date_due: req.body.date_due,
		task_tags: req.body.tags,
    task_priority: req.body.priority,
	};

	tasks.createTask(params, function (err, result) {
		return res.json(result);
	});
};

/**
 * Attempts to modify a single task. Sends the
 * result back to the client as a HTTP JSON object.
 */
var putTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		uid: req.session.user.UserID,
		tid: req.params.task_id,
		title: req.body.title,
		desc: req.body.desc,
		date_due: req.body.date_due,
		parent_id: req.body.parent_id,
		status: req.body.status,
		tags: req.body.tags,
    priority: req.body.priority
	};

	tasks.updateTask(params, function (err, result) {
		return res.json(result);
	});
};

/**
 * Attempts to get multiple tasks. Sends the
 * result back to the client as a HTTP JSON object.
 */
var getTasks = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		uid: req.session.user.UserID,
	};

	tasks.getTasks(params, function (err, result) {
		return res.json(result);
	});
};

var broadcastTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		UserID: req.session.user.UserID,
		TaskID: req.params.TaskID
	};
	
	tasks.broadcastTask(params, function (err, result) {
		return res.json(result);
	});
};

var receiveTask = function (req, res) {
	if (!req.session.user) {
		return res.json(tasks.createResponse(false, ['auth-failure'], {}));
	}

	var params = {
		Code: req.params.Code
	};
	
	tasks.receiveTask(params, function (err, result) {
		return res.json(result);
	});
};

module.exports = {
	getTask: getTask,
	getTasks: getTasks,
	createTask: createTask,
	deleteTask: deleteTask,
	putTask: putTask,
	broadcastTask: broadcastTask,
	receiveTask: receiveTask
};
