/*
  Copyright (C) Air Liquide S.A,  2017
  Author: Sébastien Lalaurette and Cyril Ferté, La Factory, Creative Foundry
  This file is part of Predictable Farm project.

  The MIT License (MIT)

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
   
  See the LICENSE.txt file in this repository for more information.
*/

var inspect = require('util').inspect;

global.env = 'prod';
global.DB_HOST = 'localhost';
global.DB_USER = 'root';
global.DB_PASS = 'root';
global.DB_NAME = 'predictablefarm';
global.DB_SOCKET_PATH = '/var/run/mysqld/mysqld.sock';

try {
    var CONFIG = require('./config');
} catch (e) {
    console.log('⚠ Config file missing. Do not forget to copy `config.json.dist` to `config.json`')
    return;
}

console.log("Environment : ", global.env);
const crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var User = require('./database/user');
var Farm = require('./database/farm');


// TODO : change addresses
var options = {
    host: global.DB_HOST,
    socketPath: global.DB_SOCKET_PATH,
    user: global.DB_USER,
    password: global.DB_PASS,
    database: global.DB_NAME
};

var sessionStore = new MySQLStore(options);

var app = express();

app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use("/auth_public", express.static('public'));
app.set('view engine', 'ejs');

var auth = require('http-auth');
var basic = auth.basic({
        realm: "Restricted Area."
    }, function (username, password, callback) {
        // Custom authentication
        // Use callback(error) if you want to throw async error.
        callback(username === CONFIG.admin_area.user && password === CONFIG.admin_area.password);
    }
);

app.use('/admin', auth.connect(basic));

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

app.get('/recipes', function (req, res) {
        res.redirect('/recipes/');
});

app.get('/api/user/status', function (req, res) {

    var myUid = req.session.userId;
    var myFarms = req.session.userFarms;
    var requestedFarm = req.query.url;
    var response;

    console.log("myUid :" + myUid);
    console.log("/api/user/status "+ inspect(myFarms) +"/"+requestedFarm);

    if (!req.session.userId) {
        console.log("myUid :" + myUid +" is not connected");
        res.json({status: "not_connected"});
        return;
    }

    if (!requestedFarm) {
        console.log("no requestedFarm ");
        res.json({farms: myFarms});
        return;
    } else {
        for (var i = 0; i < myFarms.length; i++) {
            console.log("myFarms["+i+"].address = "+ myFarms[i].address);
            if (myFarms[i].address == requestedFarm) {
                console.log("access_granted");
                res.json({status: "access_granted"});
                return;
            }
        }
        res.json({status: "no_access_to_farm"});
        return;
    }
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect("/?message=logout_success");
    })
});

//login to the dashboard
app.get('/login', function (req, res) {
    console.log("login :" +req.query);
    res.render("login", {message: req.query.message});
});

app.get('/admin', function (req, res) {
    var f = new Farm();
    f.getFarms(function (rows) {
        var farms = []
        rows.forEach(function (el) {
            farms.push({
                farm_id: el.farm_id,
                farm_name: el.farm_name
            })
            console.log(el)
        })
        res.render("admin", {
            farms: farms,
            message:req.query.message
        });
    })
});

app.post('/admin/add-user', function (req, res) {
    var data = req.body;
    console.log(data);

    var u = new User();
    u.addNewEntry(data,function (err, rows) {
        if(err){
            console.log(err);
            res.redirect("/admin?message=user_not_registered");
            return;
        }
        console.log(rows);
        res.redirect("/admin?message=user_registered");
    });
});

app.post('/admin/add-farm', function (req, res) {
    var data = req.body;
    console.log(data);

    var f = new Farm();
    f.addNewEntry(data,function (err, rows) {
        if(err){
            console.log(err);
            res.redirect("/admin?message=user_not_registered");
            return;
        }
        res.redirect("/admin?message=farm_registered");
    })
});

app.post('/login', function (req, res) {
    console.log("login request", req.query);
    var user = new User();
    user.getUserByName(req.body.username, function (callbackData) {
        var length = callbackData.length;
        if (length == 1) {
            var data = callbackData[0];
            var hash = data.password_hash;

            var pass = req.body.pass;
            var farmid = data.farm_id;
            console.log("farm :" + farmid + " user_id : "+data.id_user+ " pass : "+pass) ;

            var crypt = crypto.createHash('sha1');
            crypt.update(pass + data.password_salt);
            var hashedPass = crypt.digest('hex');

            console.log("hashedPass :" + hashedPass + " hash in db : "+hash) ;
            if (hashedPass == hash) {
                console.log("password match !") ;
                console.log("retrieve farm list for the user "+data.id_user) ;
                
                user.getAllFarms(data.id_user, function (farms) {
                    req.session.userName = data.name;
                    req.session.userId = data.id_user;
                    req.session.userFarms = farms;
                    console.log("hostname :" + req.hostname);

                    for (var i = 0; i < farms.length; i++) {
                        console.log("farm hostname :" + farms[i].address);
                        // if (farms[i].address == req.hostname) 
                        {
                            console.log("database matching for hostname :" + req.hostname);
                            res.redirect("/?message=connected");
                            return;
                        }
                    }
                    res.redirect("/?message=no_access_to_farm");
                    return;
                })

            } else {
                console.log("error");
                res.redirect("/?message=incorrect_password");
            }
        } else {
            res.redirect("/?message=unkown_user");
        }

    });
});

app.listen(CONFIG.port, function() {
    console.log('listening on *:' + CONFIG.port);
});
