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

/*
* getUser()
*
* Attempts to log in a user
*/

var userLogin = function (req, res) {
	var params = {
		Username: req.body.username,
		Password: req.body.password
	};

	users.userLogin(params, function (err, result, userID) {
		if (result.success) {
			req.session.user = result.data;
			req.session.user.UserID = userID;
		}

		res.json(result);
	});
};


/*
* createUser()
*
* 
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

	users.createUser(params, function (err, result) {
		return res.json(result);
	});
};

var userVerify = function (req, res) {
	var params = {
		verificationCode: req.body.verificationCode,
	};

	users.consumeVerficationCode(params, function (err, result) {
		return res.json(result);
	});
};

module.exports = {
	userCreate: userCreate,
	userLogin: userLogin,
	userVerify: userVerify,
};
