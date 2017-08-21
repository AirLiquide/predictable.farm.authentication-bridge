/**
 * Created by admin on 20/03/2017.
 */

global.env = process.env.NODE_ENV || 'dev';
console.log("Environment : ", global.env);
const crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var User = require('./database/user');
var Farm = require('./database/farm');


//TODO : change addresses
var options = {
    host: (global.env == 'prod') ? '35.158.33.67' : 'localhost',
    port: 3306,
    user: 'root',
    password: 'toor',
    database: 'predictablefarm'
};

var sessionStore = new MySQLStore(options);

/*
 {
 farmId : { socket : farmSocket , dashboardSocket : socketDash }
 } */


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
        realm: "Simon Area."
    }, function (username, password, callback) {
        // Custom authentication
        // Use callback(error) if you want to throw async error.
        callback(username === "admin" && password === "LaFactoryLedruRollin91");
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


//Registration, do not make public
app.get('/register/Jxzipgg4gXM43x6y9M1JLCED9oLy13', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/api/user/status', function (req, res) {
    var myFarms = req.session.userFarms;
    var requestedFarm = req.query.url;
    var response;

    if (!req.session.userId) {
        res.json({status: "not_connected"});
        return;
    }


    if (!requestedFarm) {
        res.json({farms: myFarms});
        return;
    }
    else {
        for (var i = 0; i < myFarms.length; i++) {
            if (myFarms[i].address == requestedFarm) {
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
    console.log(req.query);
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
    console.log(data)

    var u = new User();
    u.addNewEntry(data,function () {
        res.redirect("/admin?message=user_registered");

    })

});


app.post('/admin/add-farm', function (req, res) {
    var data = req.body;
    console.log(data);

    var f = new Farm();
    f.addNewEntry(data,function () {
        res.redirect("/admin?message=farm_registered");

    })



});


app.post('/login', function (req, res) {
    console.log("login request", req.query);
    var user = new User();
    user.getUserByName(req.body.username, function (callbackData) {

        console.log("req", req.body);
        var length = callbackData.length;
        if (length == 1) {
            var data = callbackData[0];
            var hash = data.password_hash;

            var pass = req.body.pass;

            var crypt = crypto.createHash('sha1');
            crypt.update(pass);
            var hashedPass = crypt.digest('hex');
            if (hashedPass == hash) {

                user.getAddress(data.farm_id, function (farms) {
                    console.log(farms);
                    req.session.userName = data.name;
                    req.session.userId = data.id_user;
                    req.session.userFarms = farms;
                    console.log(req.host);

                    for (var i = 0; i < farms.length; i++) {
                        if (farms[i].address == req.host) {
                            res.redirect("/?message=connected");

                            return;
                        }
                    }
                    res.redirect("/?message=no_access_to_farm");

                    return;
                })

            }
            else {
                console.log("erreur");
                res.redirect("/?message=incorrect_password");
            }
        }
        else {
            res.redirect("/?message=unkown_user");
        }

    });
    //console.log(req.body);
});

app.listen((global.env == 'prod') ? 80 : 8000, function () {
    console.log('listening on *:80');
});
