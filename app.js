var config = require('./user_modules/config.js');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var knex = require('knex');
var knexSessionStore = require('connect-session-knex')(session);
var routes = require('./routes/index');
var apiV1 = require('./routes/api.v1');
var tasks = require('./user_modules/tasks.js');

var knexSql = new knex({
	client: 'mysql',
	connection: {
		host: config.mysql.host,
		user: config.mysql.user,
		password : config.mysql.password,
		database : config.mysql.database
	}
});

var store = new knexSessionStore({
    knex: knexSql,
    tablename: 'Sessions'
});

var app = express();

app.locals.application = "Taskie";

app.use(session({
    secret: config.session.secret,
    resave: config.session.resave,
    saveUninitialized: config.session.saveUninitialized,
    cookie: {
        maxAge: config.session.cookie.maxAge
    },
    store: store
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('[:date[web]] ":method :url HTTP/:http-version" :status :res[content-length]'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/api/v1', apiV1);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/* Set up the notification system */
var notifyTasks = function () {
  tasks.getNotifTasks(function (error, result) {
      if (!result.success) {
        console.log("[task_notif] An error occured: " + result.messages.join);
        return;
      }
      var users = {};
      // Aggregate by user
      result.data.forEach(function (task) {
        if (users[task.UserID]) {
          users[task.UserID].Tasks.push(task);
        }
        else {
          users[task.UserID] = {};
          users[task.UserID].Firstname = task.Firstname;
          users[task.UserID].Lastname = task.Lastname;
          users[task.UserID].Email = task.Email;
          users[task.UserID].Tasks = [task];
        }
      });
      
      // Send out emails for each user
      Object.keys(users).forEach(function (userID) {
        tasks.sendNotifTasks({User: users[userID]});
      });
    }
  );
}

setInterval(function () {
  notifyTasks();
}, 600000);

notifyTasks();

module.exports = app;
