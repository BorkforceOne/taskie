var config = require('./config.js');
var database = require('./database.js');
var mysql = require('mysql');

console.log("Loading tasks.js");

var jsonifyTask = function (entry) {
	return {
			type: 'task',
			data: {
				id: entry.TaskID,
				title: entry.TaskTitle,
				desc: entry.TaskDesc,
				tag: entry.TaskTag,
				parent_id: entry.ParentTaskID,
				date_due: entry.TaskDueDate,
				date_create: entry.TaskAddedOnDate,
				date_update: entry.TaskUpdatedOnDate
			}
		}
}

var jsonifyTasks = function (entries) {
	var result = [];
	for (var i=0; i<entries.length; i++) {
		result.push(jsonifyTask(entries[i]));
	}
	return result;
}

/*
* getTask()
*
* 
*/
var getTask = function (params, cb) {
  var sql = "SELECT `TaskID`,`TaskTitle`,`TaskDesc`,`TaskTag`,`RecordStatus`,`ParentTaskID`,`TaskDueDate`,`TaskAddedOnDate`,`TaskUpdatedOnDate` FROM tasks WHERE TaskID = ? AND UserID = ?";
  var inserts = [params.tid, params.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
		return cb(null, createResponse(true, [], jsonifyTasks(rows)));
  });
};

/*
* deleteTask()
*
* 
*/
var deleteTask = function (params, cb) {
  var sql = "DELETE FROM `tasks` WHERE `TaskID` = ? AND `UserID` = ?";
  var inserts = [params.tid, params.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-delete-error'], {}));
    }
		if (rows.affectedRows == 0) {
			return cb(err, createResponse(false, ['task-delete-error', 'task-nonexistent'], {}));
		}
		return cb(null, createResponse(true, [], {}));
  });
};

/*
* createTask()
*
* 
*/
var createTask = function (params, cb) {
  var sql = "INSERT INTO `tasks` (`UserID`, `TaskTitle`, `TaskDesc`, `ParentTaskID`, `TaskDueDate`, `TaskTag`) VALUES (?, ?, ?, ?, ?, ?);";
  var inserts = [params.uid, params.task_title, params.task_desc, params.task_parent_id, params.task_date_due, params.task_tag];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-create-error'], {}));
    }

		var params_new = {
			uid: params.uid,
			tid: rows.insertId
		};

		getTask(params_new, function (err, result) {
			if (err){
				return cb(err, createResponse(false, ['task-create-error'].concat(result.messages), {}));
			}
			return cb(null, createResponse(true, [], result.data));
		});
  });
};

/*
* updateTask()
*
* 
*/
var updateTask = function (params, cb) {
	
	var sql_updates = [];
	var sql_inserts = [];
	
	if (params.title != undefined) {
		sql_updates.push("`TaskTitle` = ?");
		sql_inserts.push(params.title);
	}
	if (params.desc != undefined) {
		sql_updates.push("`TaskDesc` = ?");
		sql_inserts.push(params.desc);
	}
	if (params.tag != undefined) {
		sql_updates.push("`TaskTag` = ?");
		sql_inserts.push(params.tag);
	}
	if (params.parent_id != undefined) {
		sql_updates.push("`ParentTaskID` = ?");
		sql_inserts.push(params.parent_id);
	}
	if (params.date_due != undefined) {
		sql_updates.push("`TaskDueDate` = ?");
		sql_inserts.push(params.date_due);
	}

	var sql = "UPDATE `tasks` SET ";
	sql += sql_updates.join(', ');
	sql += " WHERE `TaskID`=? AND `UserID`=?;"

	sql_inserts.push(params.tid);
	sql_inserts.push(params.uid);

  sql = mysql.format(sql, sql_inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-update-error'], {}));
    }
		if (rows.affectedRows == 0) {
			return cb(err, createResponse(false, ['task-update-error', 'task-nonexistent'], {}));
		}

		var params_new = {
			uid: params.uid,
			tid: params.tid
		};

		getTask(params_new, function (err, result) {
			if (err){
				return cb(err, createResponse(false, ['task-update-error'].concat(result.messages), {}));
			}
			return cb(null, createResponse(true, [], result.data));
		});
  });
};

/*
* getTasks()
*
* 
*/
var getTasks = function (params, cb) {
  var sql = "SELECT `TaskID`,`TaskTitle`,`TaskDesc`,`TaskTag`,`RecordStatus`,`ParentTaskID`,`TaskDueDate`,`TaskAddedOnDate`,`TaskUpdatedOnDate` FROM tasks WHERE UserID = ?";
  var inserts = [params.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
		return cb(null, createResponse(true, [], jsonifyTasks(rows)));
  });
};

var createResponse = function (success, messages, data) {
	return {success: success, messages: messages, data: data};
}

module.exports = {
	getTask: getTask,
	getTasks: getTasks,
	createTask: createTask,
	deleteTask: deleteTask,
	updateTask: updateTask,
	createResponse: createResponse
};
