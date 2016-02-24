console.log("Loading accounts.js");

exports = module.exports = {};

var mysql = require('mysql');
var database = require('./database');
var config = require('./config');
var email = require('./email');
var bcrypt = require('bcrypt');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');


exports.validatePassword = function (password, o, callback) {
	bcrypt.hash(password, o.Salt, function (err, hash) {
		if (err) {
			callback(err);
		}
		else if (hash == o.Password) {
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

exports.sendEmailVerification = function (userinfo) {
  
  var verificationUrl = 'https://app.taskie.xyz/verify?code=' + userinfo.verification_code;

	email.sendEmail({template: email.mailTemplates.activate, mailTo: userinfo.email, subject: 'Taskie Account Activation', vars: {name: userinfo.firstname, application: 'Taskie', verificationUrl: verificationUrl, mailtoAddress: 'webmaster@taskie.xyz', mailtoName: 'Taskie Support'}}, function (err, results) {
		console.log(results.response);
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
			console.log("No user found");
			callback(null);
		}
	});
};

exports.getUser = function (user, callback) {
	var sql = "SELECT * FROM `Users` WHERE `Username` = ?";
	var inserts = [user];
	sql = mysql.format(sql, inserts); 

	database.connectionPool.query(sql, function(err, rows, fields) {
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
};

exports.useVerficationCode = function (code, callback) {
	var sql = "SELECT * FROM `Users` WHERE `VerificationCode`=?";
	var inserts = [code];
	sql = mysql.format(sql, inserts); 

	database.connectionPool.query(sql, function(err, rows, fields) {
		if (err) {
			callback("An error occured looking up code: " + err, null);
			return;
		} else {
			if (rows.length == 1) {
				var sql = "UPDATE `Users` SET `VerificationCode` = '' WHERE `UserID` = ?";
				var inserts = [rows[0].UserID];
				sql = mysql.format(sql, inserts); 
				database.connectionPool.query(sql, function(err, rows, fields) {
					if (err) {
						callback("An error occured consuming verification code: " + err, null);
						return;
					}
					callback(null, true);
				});
			}
			else {
				callback(null, false);
				return;
			}
		}
	});
	
};

exports.validUsername = function (userinfo, callback) {
  // Check that username is longer than 3 characters
	
  var messages = [];
  if (userinfo.username.length < 2) {
		messages.push("Username must be at least 2 characters long");
  }

	if (userinfo.username.length > 128) {
		messages.push("Username cannot exceed 128 characters");
	}

	var space_regex = /.*\s.*/i;

	if (space_regex.test(userinfo.username)) {
		messages.push("Username cannot contain spaces");
	}
  
  callback(null, messages);
};

exports.validEmail = function (userinfo, callback) {
  // Check that password is longer than 3 characters
  var messages = [];

	if (userinfo.email != userinfo.email_conf) {
		messages.push("Emails do not match");
	}

	var email_regex = /.+@.+\..+/i;

	if (!email_regex.test(userinfo.email)) {
		messages.push("Invalid email address");
	}
  
  callback(null, messages);
};

exports.validPassword = function (userinfo, callback) {
  // Check that password is longer than 3 characters
  var messages = [];

	if (userinfo.password != userinfo.password_conf) {
		messages.push("Passwords do not match");
	}

  if (userinfo.password.length < 6) {
		messages.push("Password must be at least 6 characters long");
  }

  callback(null, messages);
};

exports.validUserinfo = function (userinfo, callback) {
  var messages = [];

	async.series([
		function(callback){
			exports.validUsername({username: userinfo.username}, callback);
		},
		function(callback){
			exports.validPassword({password: userinfo.password, password_conf: userinfo.password_conf}, callback);
		},
		function(callback){
			exports.validEmail({email: userinfo.email, email_conf: userinfo.email_conf}, callback);
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
								exports.sendEmailVerification({email: userinfo.email, firstname: userinfo.firstname, verification_code: userinfo.verification_code});
								console.log("Emailing '" + userinfo.email + "' verification_code: '" + userinfo.verification_code + "'");
								callback(null, {success: res});
							}
						});
					});
				});
			});
		});
	});
};

exports.addUser = function (userinfo, callback) {
	var sql = "INSERT INTO `Users` (`UserID`, `Username`, `Password`, `Email`, `Salt`, `VerificationCode`, `Firstname`, `Lastname`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?);";
	var inserts = [userinfo.username, userinfo.password, userinfo.email, userinfo.salt, userinfo.verification_code, userinfo.firstname, userinfo.lastname];
	sql = mysql.format(sql, inserts); 

	database.connectionPool.query(sql, function(err, rows) {
		if (err) {
			callback("An error occured inserting user: " + err, null);
			return;
		} else {
			callback(null, rows);
			return;
		}
	});
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
