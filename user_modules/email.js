var config = require('./config.js');
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate

console.log("Loading email.js");

// Create the main mail transporter
var mailTransporter = nodemailer.createTransport(config.email_account.no_reply);

// Load all templates we want here
var mailTemplates = {};

mailTemplates.welcome = new EmailTemplate('./mail-templates/welcome');
mailTemplates.activate = new EmailTemplate('./mail-templates/activate');

var sendEmail = function (o, cb) {
  o.template.render(o.vars, function (err, results) {
		if (err) {
			console.error('ERROR [email.js]: %s', err);
			cb(err, null);
			return;
		}
		// setup e-mail data
		var mailOptions = {
				from: 'Taskie <no-reply@taskie.xyz>', // sender address
				to: o.mailTo, // list of receivers
				subject: o.subject, // Subject line
				html: results.html
		};

		// send mail with defined transport object
		mailTransporter.sendMail(mailOptions, function(err, results){
				if (err){
					console.error('ERROR [email.js]: %s', err);
					cb(err, null);
					return;
				}
				cb(null, results);
		});
	});
};

module.exports = {
	mailTemplates: mailTemplates,
	sendEmail: sendEmail
};
