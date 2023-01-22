/*
 * Video reference: https://www.youtube.com/watch?v=Uk5DbEnFNP0
 * Code reference: https://github.com/coding-with-chaim/toggle-cam-final
 */

const express = require('express');
const session = require("express-session");
const app = express();
const http = require('http');
const bcrypt = require('bcryptjs');
const fs = require("fs");
const {
    JSDOM
} = require('jsdom');

app.use(express.json());

const path = require('path');

const User = require('./src/models/model')
// const User = require('./src/models/model')();

require('./src/db/mongoose')
app.use(express.static('./public'));
const {
    Server
} = require('socket.io');

app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);


// Paths
app.use('/css', express.static('./public/css'));
app.use('/js', express.static('./public/js'));
app.use('/html', express.static('./public/html'));
app.use('/img', express.static('./public/img'));


// Session
app.use(session({
    secret: "secret",
    name: "WebRTCSessionID",
    resave: false,
    saveUninitialized: true
}));



// Go to the landing page
app.get('/', function (req, res) {
    // If there is a current session, go directly to the main page
    if (req.session.loggedIn) {
        res.redirect("/main");

    } else {
        // If there's no session, go to the login page
        let login = fs.readFileSync("./public/html/index.html", "utf8");
        let loginDOM = new JSDOM(login);
        res.send(loginDOM.serialize());
    }
});


// Go to the signup page
app.get('/signup', function (req, res) {

    // If there's no session, go to the login page
    let signup = fs.readFileSync("./public/html/newUser.html", "utf8");
    let signupDOM = new JSDOM(signup);
    res.send(signupDOM.serialize());
});


// When user successfully logs in
app.get("/main", function (req, res) {

    // Check if user is logged in, if they are then check the user's type
    if (req.session.loggedIn) {
        let main = fs.readFileSync("./public/html/main.html", "utf8");
        let mainDOM = new JSDOM(main);
        res.send(mainDOM.serialize());
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});


app.get('/room/:roomId', (req, res) => {
    // res.sendFile(`${__dirname}/public/html/room.html`);

    if (req.session.loggedIn) {
        res.sendFile(`${__dirname}/public/html/room.html`);
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});


app.get("/message", function (req, res) {

    if (req.session.loggedIn) {
        let message = fs.readFileSync("./public/html/message.html", "utf8");
        let messageDOM = new JSDOM(message);
        res.send(messageDOM.serialize());
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});



var usernameIdPairs = new Map();
app.post('/add-username-id-pair', (req, res) => {
    let userID = req.body.userID;
    console.log("USER ID: " + userID)

    // Store values in map
    // usernameIdPairs.set(userID, req.session.username);
    usernameIdPairs[userID] = req.session.username;
    
    console.log("MAP: " + JSON.stringify(usernameIdPairs))
   
    res.send({
        status: "Success"
    });
})


// var users = [];
var otherUsers = [];
var allSocketUsers = [];

var allCallsIDs = [];
var MAX_USERS = 10;

/* SOCKET CONNECTION FOR RTC */
io.on('connection', socket => {
    socket.on('user joined room', roomId => {
        const room = io.sockets.adapter.rooms.get(roomId);
        console.log("ROOM: " + JSON.stringify(room))
        console.log("ROOM ID: " + roomId)

        // If the room hasn't already been added to the array
        if (!allCallsIDs.includes(roomId)) {
            allCallsIDs.push(roomId);
        }
        console.log("ALL CALLS: " + allCallsIDs)

        allSocketUsers.push(socket.id)

        console.log("SOCKET JOINED: " + socket.id)
        // console.log("SOCKET: " + socket)

        if (room && room.size === MAX_USERS) {
            socket.emit('server is full');
            return;
        }

        // If the room exists, store the current users 
        if (room) {
            console.log("ROOM EXISTS")
            room.forEach(id => {
                otherUsers.push(id);
                console.log("ID: " + id)

                // allSocketUsers.push(id)
            })
        }

        socket.join(roomId);    // Connect user to room
        socket.emit('all other users', otherUsers);


        socket.on("send-message-to-group", function (data) {
            console.log("SEND MSG SERVER")
            console.log("MESSAGE: " + data)
    
            io.to(roomId).emit("send-message-to-group", data);
        });

    });

    socket.on('peer connection request', ({
        userIdToCall,
        sdp
    }) => {
        io.to(userIdToCall).emit("connection offer", {
            sdp,
            callerId: socket.id
        });
        
    });

    socket.on('connection answer', ({
        userToAnswerTo,
        sdp
    }) => {
        io.to(userToAnswerTo).emit('connection answer', {
            sdp,
            answererId: socket.id
        })
    });

    socket.on('ice-candidate', ({
        target,
        candidate
    }) => {
        io.to(target).emit('ice-candidate', {
            candidate,
            from: socket.id
        });
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            socket.to(room).emit('user disconnected', socket.id);
        });
    });



    socket.join(socket.user);  // Connect user to socket


    socket.on('call', (data) => {
        let callee = data.name;
        let rtcMessage = data.rtcMessage;

        socket.to(callee).emit("newCall", {
            caller: socket.user,
            rtcMessage: rtcMessage
        })

    })

    socket.on('answerCall', (data) => {
        let caller = data.caller;
        rtcMessage = data.rtcMessage

        socket.to(caller).emit("callAnswered", {
            callee: socket.user,
            rtcMessage: rtcMessage
        })

    })

    socket.on('ICEcandidate', (data) => {
        let otherUser = data.user;
        let rtcMessage = data.rtcMessage;

        socket.to(otherUser).emit("ICEcandidate", {
            sender: socket.user,
            rtcMessage: rtcMessage
        })
    })


    socket.on('send message', (msg) => {
        console.log('message: ' + msg);
        io.emit('send message', msg);
    });





    socket.on("a-user-connects", function (username) {
        // Save in array
        users[username] = socket.id;

        // socket ID will be used to send message to individual person
        io.emit("a-user-connects", username);
    });

    socket.on("send-message-to-other-user", function (data) {
        // send event to userReceiving
        var socketId = users[data.userReceiving];

        io.to(socketId).emit("new-message-from-other-user", data);
    });


    socket.on("user-connected-sound", (roomId) => {
        console.log("CONNECTED SOUND SERVER");
        console.log("ROOM: " + roomId);

        io.to(roomId).emit("user-connected-sound", roomId);
    });

});





app.post('/get-call-ids', (req, res) => {
    // Send to client all currently open calls
    res.send({
        callIDs: allCallsIDs
    });
})


// Gett current session user
app.post("/get-current-username", function (req, res) {
    if (req.session.loggedIn) {
        // User is logged in
        res.send({
            status: "Success",
            username: req.session.username
        });
    } else {
        res.send({
            status: "Fail",
            username: "N/A"
        });
    }
});



app.post('/authenticate', (req, res) => {

    User.findOne({username: req.body.username})
        .then((data) => {
            if (!data) {
                console.log('INVALID USER')
                res.redirect('/login')
            } else {
                hash = data.password
                myPlainTextPassword = req.body.password

                bcrypt.compare(myPlainTextPassword, hash).then((result) => {
                    if (result) {
                        console.log("AUTHENTICATED")

                        req.session.loggedIn = true;
                        req.session.username = req.body.username;
                        req.session.password = req.body.password;

                        req.session.save(function (err) {
                            // Session saved
                        });

                        res.sendStatus(200)
                    } else {
                        console.log("NOT AUTHENTICATED")
                        res.sendStatus(201)
                        // res.redirect('/')
                    }

                })

            }
        })

})


app.post('/adduser', (req, res) => {
    // console.log(req.body.username);
    // console.log(req.body.password);
    bcrypt.hash(req.body.password, 8).then((element) => {
        User.create({ username: req.body.username, password: element })

        console.log("SESSION CREATED")
        req.session.loggedIn = true;
        req.session.username = req.body.username;
        req.session.password = req.body.password;

        req.session.save(function (err) {
            // Session saved
        });

    })
    res.status(200).json({
        success: true,
        data: {
            msg: 'Created new user!'
        }
    })
})


// Logout of the session
app.get("/logout", function (req, res) {

    if (req.session) {
        req.session.destroy(function (error) {
            if (error) {
                res.status(400).send("Unable to log out");
            } else {
                // Session deleted, redirect to index page
                res.redirect("/");
            }
        });
    }
});



// Server runs on the port below
let port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('server is running on port ' + port)
});