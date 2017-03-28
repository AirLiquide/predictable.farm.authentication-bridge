var MariaSql = require('mariasql');

// Db access info
var DB_HOST = 'localhost';
var DB_USER = 'root';
var DB_PASS = 'root';
var DB_NAME = 'predictablefarm';

// Singleton handling
var instance = null;

// Database interface for MAP
var createInstance = function() {
	instance = new MariaSql({
		host : DB_HOST,
		user : DB_USER,
		password : DB_PASS,
		db : DB_NAME
	});
};

var getInstance = function() {
	if (instance === null) {
		createInstance();
	}

	return instance;
};

module.exports = getInstance();