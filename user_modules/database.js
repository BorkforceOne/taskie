/*
 * database.js
 *
 * Handle creating the connection pool with 
 * paramters defined in the config file.
 */

console.log("Loading database.js");

var config = require('./config.js');
var mysql = require('mysql');

var connectionPool  = mysql.createPool({
			connectionLimit : config.mysql.connectionLimit,
			host: config.mysql.host,
			user: config.mysql.user,
			password: config.mysql.password,
			database: config.mysql.database
});

module.exports = {
	connectionPool: connectionPool
};
