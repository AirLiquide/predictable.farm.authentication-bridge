var MariaSql = require('mariasql');


// Singleton handling
var instance = null;

// Database interface for MAP
var createInstance = function() {
	instance = new MariaSql({
		host : global.DB_HOST,
		user : global.DB_USER,
		password : global.DB_PASS,
		db : global.DB_NAME
	});
};

var getInstance = function() {
	if (instance === null) {
		createInstance();
	}

	return instance;
};

module.exports = getInstance();