/*
 * users.api.js
 *
 * Simple API procedures that will call functions
 * from users.js to accomplish their goals. Also
 * ensures users are authenticated (when appropriate)
 *  prior to running any user.js code.
 */

console.log("Loading users.api.js");

var users = require('./users.js');

/**
 * Attempts to login a user and sets their session if
 * everything checks out. Sends the result back to the
 * client as a HTTP JSON object.
 */
var userLogin = function (req, res) {
	var params = {
		Username: req.body.username,
		Password: req.body.password
	};

	return users.userLogin(params, function (err, result, userID) {
		if (result.success) {
			req.session.user = result.data;
			req.session.user.UserID = userID;
		}

		return res.json(result);
	});
};

/**
 * Attempts to create a user and sends the result back
 * to the client as a HTTP JSON object.
 */
var userCreate = function (req, res) {
	var params = {
		username: req.body.username,
		password: req.body.password,
		password_conf: req.body.password_conf,
		email: req.body.email,
		email_conf: req.body.email_conf,
		firstname: req.body.firstname,
		lastname: req.body.lastname
	};

	return users.createUser(params, function (err, result) {
		return res.json(result);
	});
};

/**
 * Attempts to consume a verification code. Sends the
 * result back to the client as a HTTP JSON object.
 */
var userVerify = function (req, res) {
	var params = {
		verificationCode: req.body.verificationCode,
	};

	return users.consumeVerficationCode(params, function (err, result) {
		return res.json(result);
	});
};

module.exports = {
	userCreate: userCreate,
	userLogin: userLogin,
	userVerify: userVerify,
};
