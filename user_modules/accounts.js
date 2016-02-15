exports = module.exports = {};

var mysql = require('mysql');
var config = require('./config');
var bcrypt = require('bcrypt');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

var mail_transporter = nodemailer.createTransport('smtps://no-reply@taskie.xyz:spinoff-soften-debtor@smtp.zoho.com');


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

exports.generateVerficationCode = function (callback) {
  crypto.randomBytes(8, function(ex, buf) {
    callback(null, buf.toString('hex'));
  });
};

exports.sendEmailVerification = function (email, verification_code) {

  var verification_url = 'https://app.taskie.xyz/verify?code=' + verification_code;

	// setup e-mail data
	var mailOptions = {
			from: 'Taskie <no-reply@taskie.xyz>', // sender address
			to: email, // list of receivers
			subject: 'Taskie Account Verfication', // Subject line
			text: 'Please visit ' + verification_url + ' to complete your registration.', // plaintext body
			html: '<h1>Welcome to Taskie!</h1><br><br><p>Please visit ' + verification_url + ' (or click <a href=\'' + verification_url + '\'>here</a> to complete your registration)</p><br><br><p>If you did not sign up for an account at Taskie, please ignore this message</p>' // html body
	};

	// send mail with defined transport object
	mail_transporter.sendMail(mailOptions, function(error, info){
			if (error){
					console.warn(error);
			}
			console.log('Verification code sent to \'' + email + '\' response: ' + info.response);
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

exports.useVerficationCode = function (code, callback) {
	var connection = getDatabaseConnection();

	var sql = "SELECT * FROM `users` WHERE `verification_code`=?";
	var inserts = [code];
	sql = mysql.format(sql, inserts); 

	connection.connect();

	connection.query(sql, function(err, rows, fields) {
		if (err) {
			callback("An error occured looking up code: " + err, null);
			return;
		} else {
			if (rows.length == 1) {
				var sql = "UPDATE `users` SET `verification_code` = '' WHERE `id` = ?";
				var inserts = [rows[0].id];
				sql = mysql.format(sql, inserts); 
				connection.query(sql, function(err, rows, fields) {
					connection.end();
					if (err) {
						callback("An error occured consuming verification code: " + err, null);
						return;
					}
					callback(null, true);
				});
			}
			else {
				connection.end();
				callback(null, false);
				return;
			}
		}
	});
	
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
					exports.generateVerficationCode (function (err, res) {
						userinfo.verification_code = res;
						exports.addUser (userinfo, function (err, res) {
							if (err)
								callback(err);
							else {
								callback(null, {success: res});
								exports.sendEmailVerification(userinfo.email, userinfo.verification_code);
								console.log("Emailing '" + userinfo.email + "' verification_code: '" + userinfo.verification_code + "'");
							}
						});
					});
				});
			});
		});
	});
};

exports.addUser = function (userinfo, callback) {
	var connection = getDatabaseConnection();
	var sql = "INSERT INTO `users` (`id`, `username`, `password`, `email`, `salt`, `verification_code`) VALUES (NULL, ?, ?, ?, ?, ?);";
	var inserts = [userinfo.username, userinfo.password, userinfo.email, userinfo.salt, userinfo.verification_code];
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
