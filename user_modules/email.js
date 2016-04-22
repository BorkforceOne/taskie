/*
 * email.js
 *
 * Abstract some functions away from
 * nodemailer and use this as the main
 * access point for sending emails. 
 * Templates can be loaded here directly.
 * (TODO: Create a way to load templates externally)
 */

console.log("Loading email.js");

var config = require('./config.js');
var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate

// Create the main mail transporter
var mailTransporter = nodemailer.createTransport(config.email_account.no_reply);

// Load all templates we want here
var mailTemplates = {};

mailTemplates.welcome = new EmailTemplate('./mail-templates/welcome');
mailTemplates.activate = new EmailTemplate('./mail-templates/activate');
mailTemplates.recover = new EmailTemplate('./mail-templates/recover');
mailTemplates.task_notification = new EmailTemplate('./mail-templates/task-notification');

var sendEmail = function (o, cb) {
  // Inject some variables into o.var
  o.vars.application = "Taskie";
  o.vars.moment = require('moment');
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
