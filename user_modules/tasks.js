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
var crypto = require('crypto');

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
    if (rows.length == 0) {
    	return cb(err, createResponse(false, ['task-nonexistent'], {}));
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

  console.log('INFO [tasks.js] Sending email to: %s', user.Email);
	email.sendEmail({
		template: email.mailTemplates.task_notification,
		mailTo: user.Email,
		subject: 'Taskie - You Have Upcoming Tasks',
		vars: {
			firstname: user.Firstname,
      tasks: user.Tasks
			}
		}, function (err, results) {
			if (err)
				console.error('ERROR [tasks.js]: %s', err);
	    console.log('INFO [tasks.js] Email Response: %s', results.response);
	});
};

var genBroadcastID = function(cb) {
  crypto.randomBytes(8, function(ex, buf) {
    cb(buf.toString('hex'));
  });
}

var broadcastTask = function(params, cb) {
	getTask({tid: params.TaskID, uid: params.UserID}, function (err, result) {
		// We have the information on the task we want to clone, lets generate a SHA-256 of this JSON string
    if (err || !result.success) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-broadcast-error'], {}));
    }

		var task = result.data[0];
		// Delete the stuff we don't care about
		delete task.TaskID;
		delete task.Status;
		delete task.ParentTaskID;
		delete task.DateAdded;
		delete task.DateUpdated;

		var hash = crypto.createHash('sha256').update(JSON.stringify(task)).digest('base64');
		var link = "https://app.taskie.xyz/#/?receive=";

    // See if this task already exists in our broadcast table, if it does then just serve that
	  var sql = "SELECT `Code` FROM `Broadcasts` WHERE Hash = ?";
	  var sql_inserts = [hash]
	  sql = mysql.format(sql, sql_inserts);

	  database.connectionPool.query(sql, function(err, rows, fields) {
	    if (err) {
				console.error('ERROR [tasks.js]: %s', err);
				return cb(err, createResponse(false, ['task-broadcast-error'], {}));
	    }
	    if (rows.length == 1) {
	    	// This task has been broadcasted before, just reserve that!
	    	link += rows[0].Code;
	    	return cb(null, createResponse(true, [], {Link: link}));
	    }
	    // This hash didn't exist! Let's make it!
	    
	    // Generate some random bytes to use as the ID
	    genBroadcastID(function (code) {
			  sql = "INSERT INTO `Broadcasts` (`Hash`, `Code`, `Task`, `UserID`) VALUES (?, ?, ?, ?)";
			  sql_inserts = [hash, code, JSON.stringify(task), params.UserID]
			  sql = mysql.format(sql, sql_inserts);

			  database.connectionPool.query(sql, function(err, rows, fields) {
			    if (err) {
						console.error('ERROR [tasks.js]: %s', err);
						return cb(err, createResponse(false, ['task-broadcast-error'], {}));
			    }

			    link += code;
			    return cb(null, createResponse(true, [], {Link: link}));
			  });
	    })
	  });
	});
};

var receiveTask = function(params, cb) {
  var sql = "SELECT `Task` FROM `Broadcasts` WHERE Code = ?";
  var sql_inserts = [params.Code]
  sql = mysql.format(sql, sql_inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-broadcast-error'], {}));
    }
    if (rows.length == 0) {
    	err = "No task with that code exists in the Broadcasts table."
			console.error('ERROR [tasks.js]: %s', err);
			return cb(err, createResponse(false, ['task-recieve-nonexistent'], {}));
    }
    var result = rows[0];
    // This task exists! Lets send the info to the user
  	return cb(null, createResponse(true, [], JSON.parse(result.Task)));
  });
}

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
	broadcastTask: broadcastTask,
	receiveTask: receiveTask,
};