/**
 * Created by admin on 20/03/2017.
 */

var inspct = require('util').inspect;


global.env = 'prod';
global.DB_HOST = 'localhost';
global.DB_USER = 'root';
global.DB_PASS = 'root';
global.DB_NAME = 'predictablefarm';
global.DB_SOCKET_PATH = '/var/run/mysqld/mysqld.sock';


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
    host: global.DB_HOST,
    socketPath: global.DB_SOCKET_PATH,
    user: global.DB_USER,
    password: global.DB_PASS,
    database: global.DB_NAME
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
        callback(username === "admin" && password === "lafactory91avenueledrurollin");
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

    //console.log("status req :" + inspct(req));


    console.log("myUid :" + myUid);


    console.log("/api/user/status "+ inspct(myFarms) +"/"+requestedFarm);

    if (!req.session.userId) {

        console.log("myUid :" + myUid +" is not connected");
        res.json({status: "not_connected"});
        return;
    }


    if (!requestedFarm) {

        console.log("no requestedFarm ");
        res.json({farms: myFarms});
        return;
    }
    else {
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
            if (hashedPass == hash) 
            {
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

app.listen( 8080 , function () {
    console.log('listening on *:8080');
});
