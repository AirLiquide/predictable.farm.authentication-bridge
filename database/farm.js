var mapDb = require('./map-db');
var Farm = function () {
    var self = this;

    var values = {
        farmID: null,
        farmName: '',
        address: '',
        secretKey: ''
    };

    this.set = function (name, value) {
        values[name] = value;
    };

    this.get = function (name) {
        return values[name];
    };

    this.getAll = function () {
        return values;
    };


    // Load an action from id
    this.load = function (farmID, callback) {
        mapDb.query(
            'SELECT * FROM farm WHERE farm_id = :farm_id',
            {'farm_id': farmID},
            function (err, rows) {
                if (err) {
                    throw(err);
                }

                if (rows.info.numRows > 0) {
                    loadFromRow(rows[0]);
                }

                callback();
            }
        );
    };

    // Load a table row data into the object
    var loadFromRow = function (dbRow) {
        values.farmID = dbRow.farm_id;
        values.farmName= dbRow.farm_name;
        values.address = dbRow.address;
        values.secretKey = dbRow.secret_key;
    };

    // Insert the object values into db
    this.insert = function (callback) {
        mapDb.query(
            "INSERT INTO farm\
            SET farm_name = :farm_name,\
                address = :address,\
                secret_key = :secret_key",
            {
                farm_id: values.farmID,
                farm_name: values.farmName,
                address: values.address,
                secret_key: values.secret_key
            },
            function (err, rows) {
                if (err) {
                    throw(err);
                }

                values.farmID = rows.info.insertId;

                if (callback) {
                    callback();
                }
            }
        );
    };
};

module.exports = Farm;