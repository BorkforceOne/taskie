var express = require('express');
var router = express.Router();
var accounts = require('../user_modules/accounts');
var async = require('async');
var bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.session.loggedin) {
  	res.render('index', {title: 'Taskie', user: req.session.username});
		return;
	}
  res.redirect('/login');
});

/* GET logout page. */
router.get('/logout', function(req, res, next) {
	if (req.session.loggedin) {
		req.session.destroy();
	}
  res.redirect('/');
});

/* GET verification page. */
router.get('/verify', function(req, res, next) {
	if (req.query.code) {
		accounts.useVerficationCode(req.query.code, function (err, o) {
			if (err) {
				console.log(err);
			}
			if (o) {
				console.log('Account verified!');
  			res.render('verify', {title: 'Taskie'});
				return;
			}
			else {
				console.log('Account could not be verified with that code!');
			}
  		res.redirect('/');
		});
	}
	else {
  	res.redirect('/');
	}
});

/* GET login page. */
router.get('/login', function(req, res, next) {
	if (req.session.loggedin) {
    res.redirect('/');
		return;
	}
  res.render('login', {title: 'Taskie'});
});

/* POST login page. */
router.post('/login', function(req, res, next) {

  accounts.manualLogin(req.body.username, req.body.password, function (e, o) {
		if (o) {
			req.session.username = o.Username;
			req.session.uid = o.UserID;
			req.session.loggedin = true;
    	res.redirect('/');
			console.log("'" + o.Username + "' has logged in!");
			return;
		}
		else {
  		res.render('login', {title: 'Taskie', auth: false});
		}
	});

});

/* GET register page. */
router.get('/register', function(req, res, next) {
  var locals = { title: 'Taskie'
           };
  res.render('register', locals);
});

/* POST register page. */
router.post('/register', function(req, res, next) {

	var userinfo = {
		username: req.body.username,
		password: req.body.password,
		password_conf: req.body.password_conf,
		email: req.body.email,
		email_conf: req.body.email_conf,
		firstname: req.body.firstname,
		lastname: req.body.lastname
	};

  accounts.registerUser(userinfo, function (e, result) {
    if (result.success) {
      res.render('register', {title: 'Taskie', regSuccess: true});
      console.log("'" + req.body.username + "' has registered!");
    }
    else {
      res.render('register', {title: 'Taskie', regSuccess: false, messages: result.messages});
      console.log("Registation failed!");
    }
  });
});


module.exports = router;
