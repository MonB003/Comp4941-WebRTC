// socket.on('send-message-to-group', function(msg) {
//     var newMessage = document.createElement('p');
//     newMessage.textContent = msg;
//     messages.appendChild(newMessage);

//         // Automatically scroll down
//         messages.scrollTop = messages.scrollHeight;
//   });

//   socket.emit('send-message-to-group', {
//     userSending: thisUser,  // variable in main.js
//     message: messageInput
//   });


var userSending = localStorage.getItem('USER');

var form = document.getElementById('messageForm');
var input = document.getElementById('messageInput');
var messages = document.getElementById('allMessages');

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        let fullMessage = userSending + ": " + input.value;
        socket.emit('send-message-to-group', fullMessage);
        input.value = '';
    }
});


socket.on('send-message-to-group', function (msg) {
    console.log("SEND MSG CLIENT")
    var newMessage = document.createElement('p');
    newMessage.textContent = msg;
    messages.appendChild(newMessage);

    // Automatically scroll down
    messages.scrollTop = messages.scrollHeight;
});