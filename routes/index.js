var express = require('express');
var router = express.Router();
var async = require('async');
var bcrypt = require('bcrypt');

/* GET home page. */
router.get('/', function(req, res, next) {
	if (req.session.user) {
  	return res.render('index', {title: 'Taskie', user: req.session.user.Firstname});
	}
  return res.redirect('/html/login.html');
});

router.get('/logout', function(req, res, next) {
	req.session.destroy();
	return res.redirect('/');
});



module.exports = router;
