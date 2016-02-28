/*
 * tasks.js
 *
 * Perform all task related procedures here. 
 * Actually do the changes and the lookups
 * to and from the database!
 */

console.log("Loading users.js");

var database = require('./database.js');
var mysql = require('mysql');
var email = require('./email');
var bcrypt = require('bcrypt');
var async = require('async');
var crypto = require('crypto');

var scrubUser = function (user, cb) {
	return { Username : user.Username,
					 Firstname: user.Firstname,
					 Lastname: user.Lastname
				 };
};

var validUsername = function (userinfo, callback) {
  // Check that username is longer than 3 characters
	
  var messages = [];
  if (userinfo.username.length < 2) {
		messages.push('username-length-error');
  }

	var space_regex = /.*\s.*/i;

	if (space_regex.test(userinfo.username)) {
		messages.push('username-illegal-character-error');
	}

	getUser(userinfo.username, function (err, user) {
		if (user.success || user.messages.length > 0) {
			messages.push('username-inuse-error');
		}
		return callback(null, messages);
	});
};

var validEmail = function (userinfo, callback) {
  // Check that password is longer than 3 characters
  var messages = [];

	if (userinfo.email != userinfo.email_conf) {
		messages.push('email-mismatch-error');
	}

	var email_regex = /.+@.+\..+/i;

	if (!email_regex.test(userinfo.email)) {
		messages.push('email-illegal-character-error');
	}

	getUserByEmail(userinfo.email, function (err, user) {
		if (user.success || user.messages.length > 0) {
			messages.push('email-inuse-error');
		}
		return callback(null, messages);
	});
};

var validPassword = function (userinfo, callback) {
  // Check that password is longer than 3 characters
  var messages = [];

	if (userinfo.password != userinfo.password_conf) {
		messages.push('password-mismatch-error');
	}

  if (userinfo.password.length < 6) {
		messages.push('password-length-error');
  }

  return callback(null, messages);
};

var validUserinfo = function (userinfo, cb) {
  var messages = [];

	return async.series([
		function(callback){
			validUsername({username: userinfo.username}, callback);
		},
		function(callback){
			validPassword({password: userinfo.password, password_conf: userinfo.password_conf}, callback);
		},
		function(callback){
			validEmail({email: userinfo.email, email_conf: userinfo.email_conf}, callback);
		}],
		function(err, results){
			for (var i=0; i<results.length; i++) {
				for (var j=0; j<results[i].length; j++) {
					messages.push(results[i][j]);
				}
			}
			return cb(null, createResponse(messages.length == 0, messages, {}));
		});
}

var getUser = function (user, cb) {
	var sql = "SELECT * FROM `Users` WHERE `Username` = ?";
	var inserts = [user];
	sql = mysql.format(sql, inserts); 

	database.connectionPool.query(sql, function(err, rows, fields) {
		if (err) {
			console.error('ERROR [users.js]: %s', err);
			return cb(err, createResponse(false, ['user-lookup-error'], {}));
		}
		if (rows.length == 1) {
			return cb(null, createResponse(true, [], rows[0]));
		}
		if (rows.length > 1) {
			return cb(null, createResponse(false, ['multi-user-error'], {}));
		}
		return cb(null, createResponse(false, [], {}));
	});
};

var getUserByEmail = function (email, cb) {
	var sql = "SELECT * FROM `Users` WHERE `Email` = ?";
	var inserts = [email];
	sql = mysql.format(sql, inserts); 

	database.connectionPool.query(sql, function(err, rows, fields) {
		if (err) {
			console.error('ERROR [users.js]: %s', err);
			return cb(err, createResponse(false, ['user-email-lookup-error'], {}));
		}
		if (rows.length == 1) {
			return cb(null, createResponse(true, [], rows[0]));
		}
		if (rows.length > 1) {
			return cb(null, createResponse(false, ['multi-email-error'], {}));
		}
		return cb(null, createResponse(false, [], {}));
	});
};

var validatePassword = function (password, passwordHash, salt, cb) {
	bcrypt.hash(password, salt, function (err, hash) {
		if (err)
			return cb(err);
		if (hash == passwordHash)
			return cb(null, true);
		return cb(null, false);
	});
};

/*
* userLogin()
*
* 
*
*/
var userLogin = function (params, cb) {
	getUser(params.Username, function (err, result) {
		if (result.success){
			var user = result.data;
			return validatePassword(params.Password, user.Password, user.Salt, function (err, result) {
				if (result) { // Valid login, check for account verification
					if (user.VerificationCode)
						return cb (null, createResponse(false, ['confirm-account-error'], {}));
					return cb (null, createResponse(true, [], scrubUser(user)), user.UserID);
				}
				return cb (null, createResponse(false, ['user-login-error'], {}));
			});
		}
		return cb (null, createResponse(false, ['user-login-error'], {}));
	});
};

var consumeVerficationCode = function (params, cb) {
  var sql = "SELECT `UserID` FROM `Users` WHERE `VerificationCode` = ?";
  var inserts = [params.verificationCode];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows, fields) {
    if (err) {
			console.error('ERROR [users.js]: %s', err);
			return cb(err, createResponse(false, ['verifcode-consume-error'], {}));
    }
		if (rows.length == 1) {
			var sql = "UPDATE `Users` SET `VerificationCode` = NULL WHERE `UserID` = ?";
			var inserts = [rows[0].UserID];
			sql = mysql.format(sql, inserts);
			database.connectionPool.query(sql, function(err, rows, fields) {
				if (err) {
					console.error('error [users.js]: %s', err);
					return cb(err, createResponse(false, ['verifcode-consume-error'], {}));
				}
				return cb(null, createResponse(true, [], {}));
			});
		} else {
			return cb(null, createResponse(false, ['verifcode-invalid-error'], {}));
		}
  });
};

var genVerificationCode = function (callback) {
  crypto.randomBytes(8, function(ex, buf) {
    callback(null, buf.toString('hex'));
  });
};

var sendEmailVerification = function (userinfo) {
  var verificationUrl = 'https://app.taskie.xyz/verify?code=' + userinfo.verificationCode;
	
  email.sendEmail({template: email.mailTemplates.activate,
                   mailTo: userinfo.email,
                   subject: 'Taskie Account Activation',
                   vars: {name: userinfo.firstname,
                          application: 'Taskie',
                          verificationUrl: verificationUrl,
                          mailtoAddress: 'webmaster@taskie.xyz',
                          mailtoName: 'Taskie Support'}},
                  function (err, results) {
										if (err)
											console.error('ERROR [users.js]: %s', err);
                    console.log('INFO [users.js] Email Response: %s', results.response);
                  });
};


/*
* createUser()
*
* 
*/
var createUser = function (params, cb) {
	validUserinfo(params, function (err, result) {
		if (err || !result.success)
			return cb(null, result);
		buildUser(params, function (err, result) {
			if (err || !result.success)
				return cb(null, result);
			var user = result.data;
			addUser(user, function (err, result) {
				if (err || !result.success)
					return cb(null, result);
				sendEmailVerification(user);
				return cb(null, result);
			});
		});
	});
};

/*
* Builds a user to be ready for database insertion
*/
var buildUser = function (params, cb) {
	/* params should have the following:
		username
		password (not hashed)
		email
		firstname
		lastname
	*/

	var userinfo = {
		username: params.username,
		password: params.password,
		email: params.email,
		firstname: params.firstname,
		lastname: params.lastname
	};

	// Generate the salt
	bcrypt.genSalt(10, function (err, salt) {
		if (err) {
			console.error('ERROR [users.js]: %s', err);
			return cb(err, createResponse(false, ['user-creation-error'], {}));
		}
		userinfo.salt = salt;
		// Hash the user password
		bcrypt.hash(userinfo.password, userinfo.salt, function (err, hash) {
			if (err) {
				console.error('ERROR [users.js]: %s', err);
				return cb(err, createResponse(false, ['user-creation-error'], {}));
			}
			userinfo.password = hash;
			// Generate a verification code
			genVerificationCode(function (err, code) {
				if (err) {
					console.error('ERROR [users.js]: %s', err);
					return cb(err, createResponse(false, ['user-creation-error'], {}));
				}
				userinfo.verificationCode = code;
				return cb(null, createResponse(true, [], userinfo));
			});
		});
	});
};

var addUser = function (userinfo, cb) {
  var sql = "INSERT INTO `Users` (`UserID`, `Username`, `Password`, `Email`, `Salt`, `VerificationCode`, `Firstname`, `Lastname`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?);";
  var inserts = [userinfo.username, userinfo.password, userinfo.email, userinfo.salt, userinfo.verificationCode, userinfo.firstname, userinfo.lastname];
  sql = mysql.format(sql, inserts);

  database.connectionPool.query(sql, function(err, rows) {
    if (err) {
			console.error('ERROR [users.js]: %s', err);
			return cb(err, createResponse(false, ['user-creation-error'], {}));
    } else {
			return cb(err, createResponse(true, [], {}));
    }
  });
};


var createResponse = function (success, messages, data) {
	return {success: success, messages: messages, data: data};
}

module.exports = {
	userLogin: userLogin,
	createUser: createUser,
	consumeVerficationCode: consumeVerficationCode
};
