exports = module.exports = {};

var mysql = require('mysql');
var config = require('./config');
var bcrypt = require('bcrypt');
var async = require('async');

var getDatabaseConnection = function () {
	return mysql.createConnection(
		{
			host: config.mysql.host,
			user: config.mysql.user,
			password: config.mysql.password,
			database: config.mysql.database
		}
	);
};

exports.validatePassword = function (password, o, callback) {
	bcrypt.hash(password, o.salt, function (err, hash) {
		if (err) {
			callback(err);
		}
		else if (hash == o.password) {
			callback(null, true);
		}
		else {
			callback(null, false);
		}
	});
};

exports.manualLogin = function (user, password, callback) {
	exports.getUser(user, function (e, o) {
		// See if we found a user (there should only be one!)
		if (o) {
			exports.validatePassword(password, o, function (err, res) {
				if (res) {
					callback(null, o);
				}
				else {
					callback(null, null);
				}
			});
		}
		else {
			callback(null);
		}
	});
};

exports.getUser = function (user, callback) {
	var connection = getDatabaseConnection();

	var sql = "SELECT * FROM users WHERE username = ?";
	var inserts = [user];
	sql = mysql.format(sql, inserts); 

	connection.connect();

	connection.query(sql, function(err, rows, fields) {
		if (err) {
			callback("An error occured looking up user: " + err, null);
			return;
		} else {
			if (rows.length == 1) {
				callback(null, rows[0]);
			}
			else {
				callback('multi-user-error', null);
			}
		}
	});
	
	connection.end();
};

exports.validUsername = function (username, callback) {
  // Check that username is longer than 3 characters
  var messages = [];
  if (username.length < 3) {
		messages.push("Username must be at least 3 characters long");
  }

	if (username.length > 128) {
		messages.push("Username cannot exceed 128 characters");
	}
  
  callback(null, messages);
};

exports.validEmail = function (email, callback) {
  // Check that password is longer than 3 characters
  var messages = [];

	var email_regex = /.+@.+\..+/i;

	if (!email_regex.test(email)) {
		messages.push("Invalid email address");
	}
  
  callback(null, messages);
};

exports.validPassword = function (password, callback) {
  // Check that password is longer than 3 characters
  var messages = [];
  if (password.length < 6) {
		messages.push("Password must be at least 6 characters long");
  }

	if (password.length > 128) {
		messages.push("Password cannot exceed 128 characters");
	}
  
  callback(null, messages);
};

exports.validUserinfo = function (userinfo, callback) {
  var messages = [];

	async.series([
		function(callback){
			exports.validUsername(userinfo.username, callback);
		},
		function(callback){
			exports.validPassword(userinfo.password, callback);
		},
		function(callback){
			exports.validEmail(userinfo.email, callback);
		}],
		function(err, results){
			for (var i=0; i<results.length; i++) {
				for (var j=0; j<results[i].length; j++) {
					messages.push(results[i][j]);
				}
			}
			callback(null, {success: messages.length == 0, messages});
		});
}

exports.registerUser = function (userinfo, callback) {
  var messages = [];
	exports.validUserinfo (userinfo, function (e, o) {
		if (e) {
			callback(e);
		}
		if (!o.success) {
			for (var i=0; i<o.messages.length; i++) {
				messages.push(o.messages[i]);
			}
			callback(null, {success: false, messages: messages});
			return;
		}
		exports.getUser(userinfo.username, function (e, o) {
			if (o) {
				console.log("Found user " + o.username + " in DB!");
				messages.push("That username is already in use!");
				callback(null, {success: false, messages: messages});
				return;
			}
			bcrypt.genSalt(10, function (e, salt) {
				if (e) {
					callback(e);
					return;
				}
				userinfo.salt = salt;
				bcrypt.hash(userinfo.password, userinfo.salt, function (e, hash) {
					if (e) {
						callback(err);
						return;
					}
					userinfo.password = hash;
					exports.addUser (userinfo, function (err, res) {
						if (err)
							callback(err);
						else
							callback(null, {success: res});
					});
				});
			});
		});
	});
};

exports.addUser = function (userinfo, callback) {
	var connection = getDatabaseConnection();
	var sql = "INSERT INTO `users` (`id`, `username`, `password`, `email`, `salt`) VALUES (NULL, ?, ?, ?, ?);";
	var inserts = [userinfo.username, userinfo.password, userinfo.email, userinfo.salt];
	sql = mysql.format(sql, inserts); 

	connection.connect();

	connection.query(sql, function(err, rows) {
		if (err) {
			callback("An error occured inserting user: " + err, null);
			return;
		} else {
			callback(null, rows);
			return;
		}
	});
	
	connection.end();
};

exports.hashPassword = function (pass, salt, callback) {
	var err;
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(pass, salt, function(err, hash) {
			if (err) {
				callback(err, null);
			};
			callback(null, hash);
		});
	});
};
