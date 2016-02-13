var express = require('express');
var router = express.Router();
var accounts = require('../user_modules/accounts');
var async = require('async');
var bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Taskie' });
});

/* GET login page. */
router.get('/login', function(req, res, next) {
	
  var locals = {
				 title: 'Taskie',
         user: ''
         };

  if (req.session.username) {
    locals.user = req.session.username;
    locals.auth = true;
  }

  res.render('login', locals);
});

/* POST login page. */
router.post('/login', function(req, res, next) {

  accounts.manualLogin(req.body.username, req.body.password, function (e, o) {
		if (o) {
  		res.render('login', {title: 'Taskie', user: o.username, auth: true});
			console.log(o.username + " has logged in!");
		}
		else {
  		res.render('login', {title: 'Taskie', auth: false});
			console.log("Login for '" + req.body.user + "' failed!");
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

  accounts.registerUser({username: req.body.username, password: req.body.password, email: req.body.email}, function (e, result) {
    if (result.success) {
      res.render('register', {title: 'Taskie', regSuccess: true});
      console.log(req.body.user + " has registered!");
    }
    else {
      res.render('register', {title: 'Taskie', regSuccess: false, messages: result.messages});
      console.log("Registation failed!");
    }
  });
});


module.exports = router;
