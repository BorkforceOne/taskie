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
	return entry;
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
  var sql = "SELECT `TaskID`,`Title`,`Description`,`Status`,`ParentTaskID`,`DateDue`,`DateAdded`,`DateUpdated`,`Tags`,`Priority` FROM Tasks WHERE TaskID = ? AND UserID = ?";
  var inserts = [params.tid, params.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
    // Build the tags associated with these tasks
    for (var i=0; i<rows.length; i++)
      if (rows[i].Tags)
        rows[i].Tags = JSON.parse(rows[i].Tags);
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
  var sql = "INSERT INTO `Tasks` (`UserID`, `Title`, `Description`, `ParentTaskID`, `DateDue`, `Tags`, `Priority`) VALUES (?, ?, ?, ?, ?, ?, ?);";

	params.task_date_due = new Date(params.task_date_due);

  if (params.task_tags)
    params.task_tags = JSON.stringify(params.task_tags);
  var inserts = [params.uid, params.task_title, params.task_desc, params.task_parent_id, params.task_date_due, params.task_tags, params.task_priority];
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
	if (params.status != undefined) {
		sql_updates.push("`Status` = ?");
		sql_inserts.push(params.status);
	}
	if (params.date_due != undefined) {
		sql_updates.push("`DateDue` = ?");
		params.date_due = new Date(params.date_due);
		sql_inserts.push(params.date_due);
	}
  if (params.tags != undefined) {
		sql_updates.push("`Tags` = ?");
		params.tags = JSON.stringify(params.tags);
		sql_inserts.push(params.tags);
  }
  if (params.priority != undefined) {
    sql_updates.push("`Priority` = ?");
    sql_inserts.push(params.priority);
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
  var sql = "SELECT `TaskID`,`Title`,`Description`,`Status`,`ParentTaskID`,`DateDue`,`DateAdded`,`DateUpdated`,`Tags`,`Priority` FROM Tasks WHERE UserID = ?";
  var inserts = [params.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
    // Build the tags associated with these tasks
    for (var i=0; i<rows.length; i++)
      if (rows[i].Tags)
        rows[i].Tags = JSON.parse(rows[i].Tags);
      else
        rows[i].Tags = [];
		return cb(null, createResponse(true, [], jsonifyTasks(rows)));
  });
};

/*
* getNotifTasks
*
*/
var getNotifTasks = function (cb) {
	var sql = "SELECT `TaskID`, `Tasks`.`UserID`, `Title`, `Description`, `DateDue`, `Tasks`.`Status`, `Username`, `Firstname`, `Lastname`, `Email`, `DateLastNotification` FROM `Tasks` LEFT OUTER JOIN `Users` ON `Tasks`.`UserID` = `Users`.`UserID` WHERE `Tasks`.`Status` = 1 AND `NotificationInterval` != 0 AND (DATEDIFF(CURRENT_DATE, `DateLastNotification`) >= `NotificationInterval` OR `DateLastNotification` IS NULL) AND DATEDIFF(CURRENT_DATE, `DateDue`) <= 7;"

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-lookup-error'], {}));
    }
		return cb(null, createResponse(true, [], rows));
  });
};

/*
 *sendNotifTasks
 *
*/
var sendNotifTasks = function (params, cb) {
  var user = params.User;
	var sql_template = "UPDATE `Tasks` SET `DateLastNotification` = CURRENT_TIMESTAMP WHERE `TaskID` = ?";

  user.Tasks.forEach(function (task) {
    var sql_inserts = [task.TaskID];
    var sql = mysql.format(sql_template, sql_inserts);
    
    database.connectionPool.query(sql, function(err, rows, fields) {
      if (err) {
        console.error('ERROR [tasks.js]: %s', err);
      }
    });
  });


	email.sendEmail({
		template: email.mailTemplates.task_notification,
		mailTo: user.Email,
		subject: 'Taskie - You Have Upcoming Tasks',
		vars: {
			firstname: user.Firstname,
      tasks: user.Tasks
			}
		}, function (err, results) {
		console.log(results.response);
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
	createResponse: createResponse,
	getNotifTasks: getNotifTasks,
	sendNotifTasks: sendNotifTasks,
};
