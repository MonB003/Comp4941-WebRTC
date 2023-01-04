const express = require("express");
const session = require("express-session");
const http = require('http');

const app = express();

const fs = require("fs");
const {
    JSDOM
} = require('jsdom');
const mysql = require("mysql2");

const {
    Server
} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);





// MySQL connection setup
const is_heroku = process.env.IS_HEROKU || false;
var database = {
    host: "localhost",
    user: "root",
    password: "",
    database: "WebRTC4941",
    multipleStatements: true
};

if (is_heroku) {
    database = {
        host: "l0ebsc9jituxzmts.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
        user: "hrcxdlv5xmoghmeb",
        password: "hdqp8fvof2lew0x3",
        database: "pfj2kx53xzemm6n9",
        multipleStatements: true
    };
}



app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

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



const connection = mysql.createPool(database);
// const connection = mysql.createPool(process.env.JAWSDB_URL);






app.get('/room/:roomId', (req, res) => {
    res.sendFile(`${__dirname}/public/html/room.html`);
});


var users = [];
var MAX_USERS = 10;
io.on('connection', socket => {
    socket.on('user joined room', roomId => {
        const room = io.sockets.adapter.rooms.get(roomId);
        console.log("ROOM: " + JSON.stringify(room))
        console.log("ROOM ID: " + roomId)

        if (room && room.size === MAX_USERS) {
            socket.emit('server is full');
            return;
        }

        const otherUsers = [];

        // If the room exists, store the current users 
        if (room) {
            room.forEach(id => {
                otherUsers.push(id);
            })
        }

        socket.join(roomId);
        socket.emit('all other users', otherUsers);



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


});




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


// Go to the landing page
app.get('/signup', function (req, res) {

    // If there's no session, go to the login page
    let signup = fs.readFileSync("./public/html/signup.html", "utf8");
    let signupDOM = new JSDOM(signup);
    res.send(signupDOM.serialize());
});


// After user signs up
app.post('/signup', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    // Checks if the new user's username is already in the database (username must be unique)
    checkUsernameExists(req.body.username,
        function (recordReturned) {

            // If username validation returns null, user isn't currently in database, so their data can be inserted/added
            if (recordReturned == null) {

                // Insert the new user into the database
                connection.query('INSERT INTO users (username, password) VALUES (?, ?)',
                    [req.body.username, req.body.password],

                    function (error) {
                        if (error) {
                            // Send message saying there was an error when signing up.
                            res.send({
                                status: "Fail",
                                msg: "Error signing up."
                            });

                        } else {
                            // User is logged in, so save their data into a session
                            req.session.loggedIn = true;
                            req.session.username = req.body.username;
                            req.session.password = req.body.password;

                            req.session.save(function (err) {
                                // Session saved
                            });

                            res.send({
                                status: "Success",
                                msg: "New user logged in."
                            });
                        }
                    });

            } else {

                // Send message saying username already exists
                res.send({
                    status: "Fail",
                    field: "userName",
                    msg: "Username already exists."
                });
            }
        });
});


function checkUsernameExists(username, callback) {

    connection.query(
        "SELECT * FROM users WHERE username = ?", [username],
        function (error, results) {

            if (error) {
                res.send({
                    status: "Fail",
                    msg: "Error finding the user."
                });
            }
            if (results.length > 0) {
                // Username already exists so it cannot be added
                return callback(results[0]);

            } else {
                // Username does not exist so it can be added
                return callback(null);
            }
        }
    );
}


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


// Login validation using an username and password
app.post("/login", function (req, res) {
    res.setHeader("Content-Type", "application/json");

    // Check that the username entered belongs to a user in the database
    validateUser(req.body.username, req.body.password,
        function (recordReturned) {

            if (recordReturned == null) {
                // User login in unsuccessful
                res.send({
                    status: "Fail",
                    msg: "Account not found."
                });
            } else {
                // If user successfully logged in, authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.username = recordReturned.username;
                req.session.password = recordReturned.password;
                req.session.userID = recordReturned.id;

                req.session.save(function (err) {
                    // session saved
                });

                // Send message saying user's login was successful
                res.send({
                    status: "Success",
                    msg: "Logged in."
                });
            }
        });
});

function validateUser(username, password, callback) {

    connection.query(
        "SELECT * FROM users WHERE username = ? AND password = ?", [username, password],
        function (error, results) {

            if (error) {
                res.send({
                    status: "Fail",
                    msg: "Error finding the user."
                });
            }
            if (results.length > 0) {
                // username and password found
                return callback(results[0]);
            } else {
                // user not found
                return callback(null);
            }
        }
    );
}


// Logout of the session
app.get("/logout", function (req, res) {

    if (req.session) {
        req.session.destroy(function (error) {
            if (error) {
                res.status(400).send("Unable to log out");
            } else {
                // Session deleted, redirect to home
                res.redirect("/");
            }
        });
    }
});


// Login validation using an username and password
app.post("/get-current-username", function (req, res) {
    if (req.session.loggedIn) {
        // User is logged in
        res.send({
            status: "Success",
            username: req.session.username,
            userID: req.session.userID
        });
    } else {
        res.send({
            status: "Fail",
            username: "N/A",
            userID: "N/A"
        });
    }
});


// Page for when user makes a call
app.get("/makeCall", function (req, res) {

    // Check if user is logged in
    if (req.session.loggedIn) {
        let page = fs.readFileSync("./public/html/make-call.html", "utf8");
        let pageDOM = new JSDOM(page);
        res.send(pageDOM.serialize());
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});



app.post('/save-call-in-database', function (req, res) {
    res.setHeader("Content-Type", "application/json");

    checkCallIDExists(req.body.callID,
        function (recordReturned) {
            console.log("SAVE CALL IN DB SERVER FUNCTION")

            let callIDSent = req.body.callID;
            if (recordReturned == null) {
                console.log("CALL NOT IN DB", req.body.callID)
                // Insert the new call into the database
                connection.query('INSERT INTO videocalls (callID, status) VALUES (?, ?)',
                    [callIDSent, "OPEN"],

                    function (error) {
                        if (error) {
                            // Send message saying there was an error.
                            res.send({
                                status: "Fail",
                                msg: "Error saving call."
                            });

                        } else {
                            res.send({
                                status: "Success",
                                msg: "Call saved."
                            });
                        }
                    });
            } else {
                res.send({
                    status: "Fail",
                    msg: "Call already exists."
                });
            }
        });
});

function checkCallIDExists(callID, callback) {

    connection.query(
        "SELECT * FROM videocalls WHERE callID = ?", callID,
        function (error, results) {

            if (results.length > 0) {
                // found
                return callback(results[0]);
            } else {
                // not found
                return callback(null);
            }
        }
    );
}


app.post('/update-call-status', function (req, res) {
    res.setHeader("Content-Type", "application/json");

    console.log("UPDATE CALL IN DB")
    console.log("CALL ID: " + req.body.callID);

    checkCallIDExists(req.body.callID,
        function (recordReturned) {
            console.log("UPDATE CALL IN DB SERVER FUNCTION")
            console.log(JSON.stringify(recordReturned));

            if (recordReturned != null) {
                console.log("CALL IN DB");
                console.log("RECORD ID: " + recordReturned.id)
                // Insert the new call into the database
                connection.query('UPDATE videocalls SET status = ? WHERE id = ?',
                    ["CLOSED", recordReturned.id],

                    function (error) {
                        if (error) {
                            console.log("FAIL")

                            // Send message saying there was an error.
                            res.send({
                                status: "Fail",
                                msg: "Error saving call."
                            });

                        } else {
                            console.log("SUCCESS")
                            console.log("--------CALL STATUS UPDATED--------")
                            res.send({
                                status: "Success",
                                msg: "Call saved."
                            });
                        }
                    });
            } else {
                res.send({
                    status: "Fail",
                    msg: "Call already exists."
                });
            }
        });
});



app.post("/all-open-calls", function (req, res) {
    connection.query("SELECT * FROM videocalls WHERE status = ?",
        ["OPEN"],
        function (error, calls) {
            res.send({
                status: "Success",
                openCalls: calls
            })
        }
    );
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




app.get("/singleCall", function (req, res) {

    if (req.session.loggedIn) {
        let page = fs.readFileSync("./public/html/single-call.html", "utf8");
        let pageDOM = new JSDOM(page);
        res.send(pageDOM.serialize());
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});




app.get("/record", function (req, res) {

    if (req.session.loggedIn) {
        let page = fs.readFileSync("./public/html/record.html", "utf8");
        let pageDOM = new JSDOM(page);
        res.send(pageDOM.serialize());
    } else {
        // User is not logged in, so direct to login page
        res.redirect("/");
    }
});






// Function connects to a database, checks if database exists, if not it creates it
async function setupDatabase() {
    // Promise
    const mysql = require("mysql2/promise");
    let connection;
    let createDatabaseTables;


    if (is_heroku) {
        connection = await mysql.createConnection({
            host: "l0ebsc9jituxzmts.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
            user: "hrcxdlv5xmoghmeb",
            password: "hdqp8fvof2lew0x3",
            database: "pfj2kx53xzemm6n9",
            multipleStatements: true
        });
        createDatabaseTables = `CREATE DATABASE IF NOT EXISTS pfj2kx53xzemm6n9;
        use pfj2kx53xzemm6n9;
        CREATE TABLE IF NOT EXISTS users(
        id int NOT NULL AUTO_INCREMENT, 
        username VARCHAR(20) NOT NULL,  
        password VARCHAR(30) NOT NULL, 
        PRIMARY KEY (id));
            
            CREATE TABLE IF NOT EXISTS videocalls(
                id int NOT NULL AUTO_INCREMENT, 
                callID VARCHAR(40) NOT NULL,    
                status VARCHAR(10) NOT NULL, 
                PRIMARY KEY (id));`;
    } else {

        connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            multipleStatements: true
        });
        createDatabaseTables = `CREATE DATABASE IF NOT EXISTS WebRTC4941;
        use WebRTC4941;
        CREATE TABLE IF NOT EXISTS users(
        id int NOT NULL AUTO_INCREMENT, 
        username VARCHAR(20) NOT NULL,  
        password VARCHAR(30) NOT NULL, 
        PRIMARY KEY (id));
            
            CREATE TABLE IF NOT EXISTS videocalls(
                id int NOT NULL AUTO_INCREMENT, 
                callID VARCHAR(40) NOT NULL,    
                status VARCHAR(10) NOT NULL, 
                PRIMARY KEY (id));`;
    }

    // Creates a table for user profiles and item posts
    await connection.query(createDatabaseTables);
}



const port = process.env.PORT || 3000;
server.listen(port, () => {
    setupDatabase();
    console.log("Listening on port " + port);
});