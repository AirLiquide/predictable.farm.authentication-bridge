/**
 * Created by admin on 20/03/2017.
 */

var io = require('socket.io')(9000);
var socketClient = require('socket.io-client');
var express = require('express');
var app = express();

const crypto = require('crypto');

var keys ={
    "farm1" : { key : "6CDD52F686B19267942D35196583E", address : "http://localhost:8080"},
    "farm2" : { key : "B91474D59DD358BAA85E3192A63A3", address : "http://localhost:8081"},
    "farm3" : { key : "D85BD9CDA3AB58518AA963DF75F1D", address : "http://localhost:8082"},
    "farm4" : { key : "425C75E3D29F9C32CADFD5FD8A7D7", address : "http://localhost:8083"}
};
/*
{
farmId : { socket : farmSocket , dashboardSocket : socketDash }
}

 */
var clients = {

}

var tokens = {};

app.get('/', function (req, res) {
    res.send('hello world')
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.auth = false;

    if (socket.handshake.query.farmId){
        var farmId = socket.handshake.query.farmId;
    }
    else {
        socket.disconnect('unauthorized');
        console.log("User with no farmId tried to connect");
    }

    if (keys[farmId]){
        var key = keys[farmId];
    }
    else {
        socket.disconnect('unauthorized');
        console.log("User with wrong farmId tried to connect");
    }



    var authKey = randomKey(128);

    socket.authkey = authKey;
    socket.farmId = farmId;
    socket.authData = key;


    socket.emit("authenticate", authKey);
    setTimeout(function(){
        //If the socket didn't authenticate, disconnect it
        if (!socket.auth) {
            console.log("Disconnecting socket ", socket.id);
            socket.disconnect('unauthorized');
        }
    }, 1000);

    socket.on('authenticate', function(data){
        //check the auth data sent by the client
        if (!socket.auth){
            checkAuthToken(socket.authkey,data, socket.authData.key, function(err, success){
                if (!err && success){
                    console.log("Authenticated socket ", socket.id);
                    socket.auth = true;

                    //create the socket-client to the cloud dashboard
                    var dashboardSocket = socketClient(socket.authData.address);
                    dashboardSocket.on('connect', function(){
                        dashboardSocket.on('disconnect', function(){
                            console.log("disconnected")
                        });

                        setTimeout(function () {
                            dashboardSocket.emit('hello',{});
                        },100);
                        console.log("bridge connected to dashboard " + farmId)
                    });



                    //add the couple farmSocket/socketDashboard to the dictionary
                    clients[farmId] = {
                        farmSocket : socket,
                        dashboardSocket : dashboardSocket
                    }
                }
                else {
                    socket.disconnect('unauthorized');
                }
            });
        }
    });

    socket.on('sensor-emit', function(data) {
        if (socket.auth){
            clients[socket.farmId].dashboardSocket.emit('sensor-emit',data);
        }

    });

    socket.on('disconnect', function () {
        console.log(farmId, "disconnected at" , new Date());
    });
});


function checkAuthToken(authKey,token, secret, callback){

    var encrypted = encrypt(authKey,secret);

    if (encrypted == token){
        callback(false, true);
    }
    else{
        callback(true, false);
    }

}

function randomKey (howMany, chars) {
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

function encrypt(text, secret){
    var crypted = crypto.createHmac('sha256',secret).update(text).digest('hex');
    return crypted;
}