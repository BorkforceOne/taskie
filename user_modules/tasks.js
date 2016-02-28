/*
 * tasks.js
 *
 * Perform all task related procedures here. 
 * Actually do the changes and the lookups
 * to and from the database!
 */

console.log("Loading tasks.js");

var database = require('./database.js');
var mysql = require('mysql');
var email = require('./email');

var jsonifyTask = function (entry) {
	return {
			type: 'task',
			data: entry
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
  var sql = "SELECT `TaskID`,`Title`,`Description`,`Status`,`ParentTaskID`,`DateDue`,`DateAdded`,`DateUpdated` FROM Tasks WHERE TaskID = ? AND UserID = ?";
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
  var sql = "DELETE FROM `Tasks` WHERE `TaskID` = ? AND `UserID` = ?";
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
  var sql = "INSERT INTO `Tasks` (`UserID`, `Title`, `Description`, `ParentTaskID`, `DateDue`) VALUES (?, ?, ?, ?, ?);";

	params.task_date_due = new Date(params.task_date_due);

  var inserts = [params.uid, params.task_title, params.task_desc, params.task_parent_id, params.task_date_due];
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
		sql_updates.push("`Title` = ?");
		sql_inserts.push(params.title);
	}
	if (params.desc != undefined) {
		sql_updates.push("`Description` = ?");
		sql_inserts.push(params.desc);
	}
	if (params.parent_id != undefined) {
		sql_updates.push("`ParentTaskID` = ?");
		sql_inserts.push(params.parent_id);
	}
	if (params.date_due != undefined) {
		sql_updates.push("`DateDue` = ?");
		sql_inserts.push(params.date_due);
	}

	var sql = "UPDATE `Tasks` SET ";
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
  var sql = "SELECT `TaskID`,`Title`,`Description`,`Status`,`ParentTaskID`,`DateDue`,`DateAdded`,`DateUpdated` FROM Tasks WHERE UserID = ?";
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

/*
* getNotifTasks
*
*/
var getNotifTasks = function (cb) {
	var sql = "SELECT `TaskID`, `UserID`, `TaskTitle`, `TaskDesc`, `TaskDueDate`, `RecordStatus`, `username`, `firstname`, `lastname`, `email`, `TaskLastNotifDate` FROM `tasks` LEFT OUTER JOIN `users` ON `tasks`.`UserID` = `users`.`id` WHERE `RecordStatus` = 1 AND DATEDIFF(CURRENT_DATE, `TaskDueDate`) < 5 AND (DATEDIFF(CURRENT_DATE, `TaskLastNotifDate`) >= 1 OR `TaskLastNotifDate` IS NULL)";
	
  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
		return cb(null, createResponse(true, [], rows));
  });
};

/*
 *sendNotifTask
 *
*/
var sendNotifTask = function (params, cb) {
	var sql = "UPDATE `tasks` SET `TaskLastNotifDate` = CURRENT_TIMESTAMP WHERE `TaskID` = ?";
	var sql_inserts = [params.task_id];

  sql = mysql.format(sql, sql_inserts);

	database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
      console.error('ERROR [tasks.js]: %s', err);
    }
  });

	/*
	email.sendEmail({
		template: email.mailTemplates.task_notification,
		mailTo: params.email,
		subject: 'Taskie - Upcoming Task',
		vars: {
			name: params.firstname,
			task_name: params.task_name,
			task_desc: params.task_desc,
			task_due_date: params.task_due_date,
			application: 'Taskie',
			}
		}, function (err, results) {
		console.log(results.response);
	});
	*/
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
	createResponse: createResponse,
	getNotifTasks: getNotifTasks,
	sendNotifTask: sendNotifTask,
};
