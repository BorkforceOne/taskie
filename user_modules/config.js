// config.jsA

// Define our system as dev here
var system = "dev";
var exports = module.exports = {};

exports.mysql = {
	host: (system === 'prod') ? '127.0.0.1' : '127.0.0.1' ,
	user: (system === 'prod') ? 'taskie-user' : 'taskie-user',
	password: (system === 'prod') ? 'Wj24rV7nGbrJM646' : 'Wj24rV7nGbrJM646',
	database: (system === 'prod') ? 'taskie' : 'taskie_dev'
};

exports.session = {
	secret: (system === 'prod') ? 'yellow-dog-feels-sad' : 'old-purple-hen',
	resave: false,
	saveUninitialized: true,
	cookie: {
		//                                   (7 days)         (1 hour)
		maxAge: (system === 'prod') ? (168*(3600*(1000))) : (1*(3600*1000)),
	}
};
