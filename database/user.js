var mapDb = require('./map-db');
var crypto = require('crypto');
var inspect = require('util').inspect;

var User = function () {
    var _table = 'user';
    var _fields = ['id_user', 'name', 'password_hash', 'password_salt', 'farm_id'];
    var _ids = ['id_user']; // Identifier fields
    var _autoIncrement = true; // set to true if the id field is autoincrement

    // Default fields values
    var _defaults = {};

    // Instance values
    var _values = {};

    var _init = function () {
        // Init fields
        for (var i = 0; i < _fields.length; i++) {
            // Default value
            if (typeof _defaults[_fields[i]] !== 'undefined') {
                _values[_fields[i]] = _defaults[_fields[i]];
            }
            // Null
            else {
                _values[_fields[i]] = null;
            }
        }
    };

    this.set = function (name, value) {
        if (name === 'password') {
            _values.password_salt = generateSalt(8);
            _values.password_hash = encrypt(value, _values.password_salt);
        }
        else {
            _values[name] = value;
        }
    };

    this.add = function (name, value) {
        _values[name] += value;
    };

    this.get = function (name) {
        return _values[name];
    };

    this.getAll = function () {
        return _values;
    };

    // Load an action from id
    this.load = function (ids) {
        var query = 'SELECT * FROM ' + _table;
        var separator = ' WHERE ';
        for (var i = 0; i < _ids.length; i++) {
            var field = _ids[i];

            // Building query
            query += separator + field + ' = :' + field;
            separator = ' AND ';
        }

        mapDb.query(
                    query,
                    ids,
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (rows.length > 0) {
                            loadFromRow(rows[0]);
                        }
                    }
                    );
    };

    // Load a table row data into the object
    var loadFromRow = function (dbRow) {
        for (var i = 0; i < _fields.length; i++) {
            _values[_fields[i]] = dbRow[_fields[i]];
        }
    };

    // Insert the object values into db
    this.insert = function (callback) {
        var query = 'INSERT INTO ' + _table;
        var values = {};

        var separator = ' SET ';
        for (var i = 0; i < _fields.length; i++) {
            var field = _fields[i];

            if (!_autoIncrement || _ids.indexOf(field) === -1) {
                query += separator + field + ' = :' + field;
                separator = ', ';

                values[field] = _values[field];
            }
        }

        mapDb.query(
                    query,
                    values,
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        // autoincrement fetching
                        if (_autoIncrement) {
                            _values[_ids[0]] = rows.info.insertId;
                        }

                        if (callback) {
                            callback();
                        }
                    }
                    );
    };

    // Update the object values into db
    this.update = function (callback) {
        var query = 'UPDATE ' + _table;
        var values = {};

        var separator = ' SET ';
        var i, field;
        for (i = 0; i < _fields.length; i++) {
            field = _fields[i];

            if (_ids.indexOf(field) === -1) {
                query += separator + field + ' = :' + field;
                separator = ', ';

                values[field] = _values[field];
            }
        }

        separator = ' WHERE ';
        for (i = 0; i < _ids.length; i++) {
            field = _ids[i];

            query += separator + _ids[i] + ' = :' + _ids[i];
            values[_ids[i]] = _values[_ids[i]];
        }

        mapDb.query(
                    query,
                    values,
                    function (err) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback();
                        }
                    }
                    );
    };

    _init();

    /**********************/
    /* ADDITIONAL METHODS */
    /**********************/
    //...

    this.listAll = function (callback) {
        mapDb.query(
                    'SELECT * FROM ' + _table + ' ORDER BY ' + _ids[0],
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback(rows);
                        }
                    }
                    );
    };

    this.getFarms = function (userID , callback) {
        mapDb.query(
                    'SELECT f.farm_name as name, f.address as address ' +
                    'FROM user u ' +
                    'INNER JOIN user_farm uf ' +
                    'ON u.id_user = uf.user_id '+
                    'INNER JOIN farm f ' +
                    'ON f.farm_id = uf.farm_id '+
                    'WHERE u.id_user = ' +parseInt(userID),
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback(rows);
                        }
                    }
                    );
    };

    this.getAllFarms = function (userID , callback) {
        mapDb.query(
                    'SELECT farm_id FROM user u WHERE u.id_user = ' +parseInt(userID),
                    function (err, farms) {
                        if (err) {
                            throw(err);
                        }
                        else{
                            if(farms.length > 0){

                            console.log("farms :" + inspect(farms));
                            mapDb.query(
                                'SELECT farm_name as name, address as address ' +
                                'FROM farm '+
                                'WHERE farm_id = '+parseInt(farms[0].farm_id),
                                function (err, rows) {
                                    if (err) {
                                        throw(err);
                                    }
            
                                    if (callback) {
                                        callback(rows);
                                    }
                                }
                                ); 
                            }
                        }

                    }
                    );
    };

    this.getAddressByName = function (userID , callback) {
        mapDb.query(
                    'SELECT f.address ' +
                    'FROM user u ' +
                    'INNER JOIN farm f ' +
                    'ON f.farm_id = u.farm_id '+
                    'WHERE u.name = \''+userID+"\'",
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback(rows);
                        }
                    }
                    );
    };

    this.getUserAdrressList = function (callback) {
        mapDb.query(
                    'SELECT u.name, f.address ' +
                    'FROM user u ' +
                    'INNER JOIN farm f ' +
                    'ON f.farm_id = u.farm_id ',
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback(rows);
                        }
                    }
                    );
    };

    this.getUserByName = function (userName , callback) {
        mapDb.query(
                    'SELECT * ' +
                    'FROM user ' +
                    'WHERE name = \''+userName+"\'",
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }

                        if (callback) {
                            callback(rows);
                        }
                    }
                    );
    };

    var encrypt = function (str, salt) {
        if (typeof salt === 'undefined') {
            salt = '';
        }

        var sha1sum = crypto.createHash('sha1');
        sha1sum.update(str + salt);
        return sha1sum.digest('hex');
    };

    var generateSalt = function (saltLength) {
        var hexa = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        var salt = '';

        for (var i = 0; i < saltLength; i++) {
            salt += hexa[Math.floor(hexa.length * Math.random())];
        }

        return salt;
    };

    this.comparePassword = function (password) {
        var hashed = encrypt(password, _values.passwordSalt);

        return (hashed === _values.passwordHash);
    };

    this.addNewEntry = function (data,callback) {

        console.log("addNewEntry :" + inspect(data));
        var salt = makeid();
        if(Array.isArray(data.farms)) console.log("farm entry is an array" );
        var farms = data.farms || [];
        var firstFarmId = 0;
        if(farms.length == 1 ) {
            firstFarmId = farms.reduce(parseInt);
        } else{
            var error = "too many farm selected , please select only  1";
            throw(error);
        }

        console.log("firstFarmId :" + firstFarmId);
        mapDb.query(
                    "INSERT INTO user\
                    SET name = :username,\
                    password_hash = SHA1(:password),\
                    password_salt = :password_salt,\
                    farm_id = :farm_id",
                    {
                        username: data.username,
                        password: data.password + salt,
                        password_salt: salt,
                        farm_id:firstFarmId
                    },
                    function (err, rows) {
                        if (err) {
                            throw(err);
                        }
                        var query =  "INSERT INTO user_farm(user_id, farm_id) VALUES";
                        query += farms.map(function(e){return  "(" + parseInt(rows.info.insertId) + "," + parseInt(e) + ")"}).join(", ");
                        mapDb.query(
                                    query
                                   ,
                                    {},function(err2, rows2){
                                        if (err2) {
                                            throw(err2);
                                        }
                                        if (callback) {
                                            callback(err2, rows2);
                                        }


                                    });


                    });
    };

    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
};

module.exports = User;
