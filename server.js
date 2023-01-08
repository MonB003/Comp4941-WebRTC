/*
 * Video reference: https://www.youtube.com/watch?v=Uk5DbEnFNP0
 * Code reference: https://github.com/coding-with-chaim/toggle-cam-final
 */

const express = require('express');
const app = express();
const http = require('http');
const bcrypt = require('bcryptjs');

app.use(express.json())

const path = require('path');

const User = require('./src/models/model')
// const User = require('./src/models/model')();

require('./src/db/mongoose')
app.use(express.static('./public'));
const {
    Server
} = require('socket.io');
const { json } = require('express');
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server);





app.get('/room/:roomId', (req, res) => {
    res.sendFile(`${__dirname}/public/room.html`);
});

// io.on('connection', socket => {
//     socket.on('user joined room', roomId => {
//         const room = io.sockets.adapter.rooms.get(roomId);

//         if (room && room.size === 10) {
//             socket.emit('server is full');
//             return;
//         }

//         const otherUsers = [];

//         if (room) {
//             room.forEach(id => {
//                 otherUsers.push(id);
//             })
//         }

//         socket.join(roomId);
//         socket.emit('all other users', otherUsers);
//     });

//     socket.on('peer connection request', ({
//         userIdToCall,
//         sdp
//     }) => {
//         io.to(userIdToCall).emit("connection offer", {
//             sdp,
//             callerId: socket.id
//         });
//     });

//     socket.on('connection answer', ({
//         userToAnswerTo,
//         sdp
//     }) => {
//         io.to(userToAnswerTo).emit('connection answer', {
//             sdp,
//             answererId: socket.id
//         })
//     });

//     socket.on('ice-candidate', ({
//         target,
//         candidate
//     }) => {
//         io.to(target).emit('ice-candidate', {
//             candidate,
//             from: socket.id
//         });
//     });

//     socket.on('disconnecting', () => {
//         socket.rooms.forEach(room => {
//             socket.to(room).emit('user disconnected', socket.id);
//         });
//     });



//     socket.join(socket.user);
//     console.log("SOCKET USER: " + socket.user)

//     socket.on('call', (data) => {
//         let callee = data.name;
//         let rtcMessage = data.rtcMessage;

//         socket.to(callee).emit("newCall", {
//             caller: socket.user,
//             rtcMessage: rtcMessage
//         })

//     })

//     socket.on('answerCall', (data) => {
//         let caller = data.caller;
//         rtcMessage = data.rtcMessage

//         socket.to(caller).emit("callAnswered", {
//             callee: socket.user,
//             rtcMessage: rtcMessage
//         })

//     })

//     socket.on('ICEcandidate', (data) => {
//         let otherUser = data.user;
//         let rtcMessage = data.rtcMessage;

//         socket.to(otherUser).emit("ICEcandidate", {
//             sender: socket.user,
//             rtcMessage: rtcMessage
//         })
//     })


//     socket.on('send message', (msg) => {
//         console.log('message: ' + msg);
//         io.emit('send message', msg);
//     });

// });


var users = [];
var otherUsers = [];
var allSocketUsers = [];
var MAX_USERS = 10;
io.on('connection', socket => {
    socket.on('user joined room', roomId => {
        const room = io.sockets.adapter.rooms.get(roomId);
        console.log("ROOM: " + JSON.stringify(room))
        console.log("ROOM ID: " + roomId)

        console.log("SOCKET ID 91: " + socket.id)
        allSocketUsers.push(socket.id)

        // console.log("SOCKET: " + socket)

        if (room && room.size === MAX_USERS) {
            socket.emit('server is full');
            return;
        }

        // const otherUsers = [];

        // If the room exists, store the current users 
        if (room) {
            console.log("ROOM EXISTS")
            room.forEach(id => {
                otherUsers.push(id);
                console.log("ID: " + id)

                // allSocketUsers.push(id)
            })
        }

        socket.join(roomId);
        socket.emit('all other users', otherUsers);

        console.log("SOCKET ID 117: " + socket.id)


        // socket.on('send-message-to-group', (msg) => {
        socket.on('send-message-to-group', (screenVideo) => {
            // console.log(room)
            console.log(roomId)
            // console.log(msg)
            // socket.to(room).emit('new-group-message', socket.id);
            // io.to(roomId).emit('send-message-to-group', msg);

            // Only send to that group call
            // io.to(roomId).emit('send-message-to-group', msg);
            // io.to(roomId).emit('send-message-to-group');

            console.log("SERVER SEND")
            io.to(roomId).emit('send-message-to-group', screenVideo);


            // let urlPath = window.location.pathname;
            // let roomString = "/room/"
            // console.log(urlPath);
            // let callID = urlPath.split(roomString).pop();
            // console.log(callID)
        });



        socket.on('after-screen-share', (userSharingID) => {
            console.log("SERVER AFTER")
            console.log("USER ID: " + userSharingID)
            io.to(roomId).emit('after-screen-share', userSharingID);
        });



        socket.on('before-screen-share', (screenTrack) => {
            console.log("SERVER BEFORE")
            console.log("screenTrack: " + screenTrack)
            io.to(roomId).emit('before-screen-share', screenTrack);

            console.log("USERS: " + users)
            console.log("OTHER USERS: " + otherUsers)
        });


        socket.on('screen-share', (thisUserID) => {
            console.log("SERVER SHARE")
            console.log("ALL USERS: " + allSocketUsers)

            console.log("THIS USER: " + thisUserID)
            io.to(roomId).emit('screen-share', thisUserID);

        });


        console.log("ALL SOCKET USERS 163: " + allSocketUsers)
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



    socket.join(socket.user);
    console.log("SOCKET USER: " + socket.user)
    console.log("SOCKET ID 207: " + socket.id)

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




    console.log("ALL SOCKET USERS 269: " + allSocketUsers)
});











app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/newUser.html'));
    // res.send('');
})

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/main.html'));
    // res.send('');
})

app.post('/authenticate', (req, res) => {

    User.findOne({email: req.body.email})
        .then((data) => {
            if (!data) {
                console.log('hello')
                res.redirect('/login')
            } else {
                hash = data.password
                myPlainTextPassword = req.body.password

                bcrypt.compare(myPlainTextPassword, hash).then((result) => {
                    if (result) {
                        // req.session.loggedIn = true
                        console.log("hhbiello")
                        // res.redirect('/main')
                        res.sendStatus(200)
                    } else {
                        res.sendStatus(201)
                        res.redirect('/')
                    }

                })

            }
        })

})

app.post('/adduser', (req, res) => {
    console.log(req.body.password);
    bcrypt.hash(req.body.password, 8).then((element) => {
        // User.create({ email: req.body.email, password: element })
        User.create({ email: req.body.email, password: element })

    })
    res.status(200).json({
        success: true,
        data: {
            msg: 'Created new user!'
        }
    })
})
// app.post('/adduser', (req, res) => {
//     console.log(req.body);
//     bcrypt.hash('test', 8).then((element) => {
//         User.create({ email: 'webrtc', password: element })
//     })
//     res.status(200).json({
//         success: true,
//         data: {
//             msg: 'Created new user!'
//         }
//     })
// })



// // Connects to a database and creates a table if needed
// async function initializeDatabase() {
//     const mysql = require("mysql2/promise");
//     let connection;
//     let createDatabaseTables;

//         connection = await mysql.createConnection({
//             host: "localhost",
//             user: "root",
//             password: "",
//             multipleStatements: true
//         });
//         createDatabaseTables = `CREATE DATABASE IF NOT EXISTS 3940WebRTC;
//         use 3940WebRTC;
//         CREATE TABLE IF NOT EXISTS 3940Users(
//         id int NOT NULL AUTO_INCREMENT, 
//         username VARCHAR(20),  
//         password VARCHAR(30), 
//         PRIMARY KEY (id));`;

//     // Creates a table for users
//     await connection.query(createDatabaseTables);
// }


// Server runs on the port below
let port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('server is running on port ' + port)
    // initializeDatabase();
});