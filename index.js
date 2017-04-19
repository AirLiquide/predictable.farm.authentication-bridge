/**
 * Created by admin on 20/03/2017.
 */

global.env = process.env.NODE_ENV || 'dev';
console.log("Environment : ", global.env);
var socketClient = require('socket.io-client');
const crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var User = require('./database/user');
var Farm = require('./database/farm');

var options = {
    host: (global.env == 'prod') ? '35.158.33.67' : 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'predictablefarm_cookies'
};
var sessionStore = new MySQLStore(options);

/*
 {
 farmId : { socket : farmSocket , dashboardSocket : socketDash }
 } */

var userData = {};
new User().getUserAdrressList(function (data) {
    storeAddressList(data);
})
setInterval(function () {
    var u = new User();
    u.getUserAdrressList(function (data) {
        storeAddressList(data);
    })
}, 1000 * 60);

function storeAddressList(data) {
    for (var i = 0; i < data.length; i++) {
        //console.log(data[i].name,data[i].address)
        userData[data[i].name] = data[i].address;
    }
    //console.log(userData)
}


var clients = {};
var proxy = require('redbird')({port: 8000});
var topPriority = function (host, url) {
    //SOCKET//
    var check = /\/socket\.io\/\?farmId=([a-zA-Z0-9]+)&/.test(url);

    if (check) {
        var res = url.match(/\?farmId=([a-zA-Z0-9]+)&/);
        var farmId = res[1];
        return userData[farmId];
    }

    else
        return host;
};

topPriority.priority = 200;
proxy.addResolver(topPriority);


var app = express();
var http = require('http').Server(app);

var httpProxy = require('http-proxy');

//
// Create a proxy server with custom application logic
//
var webProxy = httpProxy.createProxyServer({});

app.use(session({
    key: 'session_cookie_name',
    secret: 'session_cookie_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('public'));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

app.use(function (req, res, next) {

    var datas = getData(req);

    //console.log(req.url);
    if (datas.name && datas.id)
    {
        var farmId = datas.name;
        var farmAddress = userData[farmId];
        console.log(req.url, farmAddress, req.session.userName)
        webProxy.web(req, res, {target: farmAddress });
    }
    else{
        next();
    }
        //res.redirect('http://localhost:8080');
});

function getData(req) {

    var name = req.session.userName;
    var id = req.session.userId;

    return {
        name : name,
        id : id}
}

app.get('/', function (req, res) {

    res.sendFile(__dirname + '/index.html');
});
//login to the dashboard
app.post('/login', function (req, res) {

    var user = new User();
    user.getUserByName(req.body.id, function (callbackData) {
        var length = callbackData.length;
        if (length == 1) {
            var data = callbackData[0];
            var hash = data.password_hash;

            var pass = req.body.pass;

            var crypt = crypto.createHash('sha1');
            crypt.update(pass);
            var hashedPass = crypt.digest('hex');

            if (hashedPass == hash) {
                user.getAddress(data.farm_id, function (callback) {
                    req.session.userName = data.name;
                    req.session.userId = data.id_user;
                    res.send({
                        success: true,
                        failure: false,
                        address: callback[0].address
                    })
                })

            }
            else {
                console.log("erreur")
            }
        }
        else {
            res.send({
                success: false,
                failure: true
            })
        }

    });
    //console.log(req.body);
});

app.listen(3000, function () {
    console.log('listening on *:3000');
});


//WILL BE REMOVED, USELESS NOW WITH THE REVERSE PROXY
// will be placed on the farm or the website.
var io = require('socket.io').listen(http);

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.auth = false;

    if (socket.handshake.query.farmId) {
        var farmId = socket.handshake.query.farmId;
    }
    else {
        socket.disconnect('unauthorized');
        console.log("User with no farmId tried to connect");
    }

    var farm = new Farm();
    farm.loadFromName(farmId, function (res) {
        var length = res.length;
        if (length == 1) {
            var address = res[0].address;
            var secret_key = res[0].secret_key;
            var farm_name = res[0].farm_name;

            if (clients[farmId]) {
                socket.disconnect('unauthorized');
                console.log("User with an already registered farmID :", farmId);
            }
            else {
                socket.farmId = farm_name;
                socket.authData = {
                    key: secret_key,
                    address: address
                };

                var authKey = randomKey(128);
                socket.authkey = authKey;

                socket.emit("authenticate", authKey);
                setTimeout(function () {
                    //If the socket didn't authenticate, disconnect it
                    if (!socket.auth) {
                        console.log("Disconnecting socket ", socket.id);
                        socket.disconnect('unauthorized');
                    }
                }, 1000);

                socket.on('authenticate', function (data) {
                    //check the auth data sent by the client
                    if (!socket.auth) {
                        checkAuthToken(socket.authkey, data, socket.authData.key, function (err, success) {
                            if (!err && success) {
                                console.log("Authenticated socket ", socket.id);
                                socket.auth = true;

                                //create the socket-client to the cloud dashboard
                                var dashboardSocket = socketClient(address);
                                dashboardSocket.on('connect', function () {
                                    dashboardSocket.on('disconnect', function () {
                                        console.log("disconnected")
                                    });

                                    dashboardSocket.on('sensor-receive', function (data) {
                                        socket.emit('sensor-receive', data);
                                    });

                                    dashboardSocket.on('init', function () {
                                        console.log("bridge connected to dashboard " + farmId)
                                        socket.emit('cloud-authenticated', data);
                                    });

                                    dashboardSocket.emit("hello");
                                });

                                //add the couple farmSocket/socketDashboard to the dictionary
                                clients[farmId] = {
                                    farmSocket: socket,
                                    dashboardSocket: dashboardSocket
                                }
                                socket.emit('authenticated');
                            }
                            else {
                                socket.disconnect('unauthorized');
                            }
                        });
                    }
                });

                socket.on('sensor-emit', function (data) {
                    if (socket.auth) {
                        clients[socket.farmId].dashboardSocket.emit('sensor-emit', data);
                    }
                });

                socket.on('disconnect', function () {
                    console.log(farmId, "disconnected at", new Date());
                });
            }

        }
        else {
            socket.disconnect('unauthorized');
            console.log("User with wrong farmId tried to connect");
        }
    });
});


//UTILS

function checkAuthToken(authKey, token, secret, callback) {

    var encrypted = encrypt(authKey, secret);

    if (encrypted == token) {
        callback(false, true);
    }
    else {
        callback(true, false);
    }

}

function randomKey(howMany, chars) {
    chars = chars
        || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    }

    return value.join('');
}

function encrypt(text, secret) {
    var crypted = crypto.createHmac('sha256', secret).update(text).digest('hex');
    return crypted;
}

