var config = require('./config.js');
var database = require('./database.js');
var mysql = require('mysql');

console.log("Loading tasks.js");

/*
* getTask({uid: uid, tid: tid})
*
* 
*/
var getTask = function (data, cb) {
  var sql = "SELECT * FROM tasks WHERE TaskID = ? AND UserID = ?";
  var inserts = [data.tid, data.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
      cb(err, null);
      return;
    }
		if (rows.length == 1) {
			cb(null, rows[0]);
		}
		else {
			err = 'Wrong number of tasks returned on getTask';
			console.error('ERROR [tasks.js]: %s', err)
			cb(err, null);
		}
  });
};

/*
* getTasks({uid: uid})
*
* 
*/
var getTasks = function (data, cb) {
  var sql = "SELECT * FROM tasks WHERE UserID = ?";
  var inserts = [data.uid];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [tasks.js]: %s', err);
      cb(err, null);
      return;
    }
		cb(null, rows);
  });
};


module.exports = {
	getTask: getTask,
	getTasks: getTasks
};
