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

/* GET logout page. */
// Destroys the user's cookie server side and client side
router.get('/logout', function(req, res, next) {
	req.session.destroy();
	return res.redirect('/'); // Redirect to the root after it's done
});



module.exports = router;
