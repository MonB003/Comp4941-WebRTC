// Connects to socket io
var socket = io();

// Stores the current user
var userSending = localStorage.getItem('USER');
document.getElementById("thisUsername").innerHTML = userSending + "'s messages";

document.getElementById("backButton").addEventListener("click", () => {
    window.location.replace("/main.html")
})

var form = document.getElementById('messageForm');
var input = document.getElementById('messageInput');
var messages = document.getElementById('allMessages');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    let fullMessage = userSending + ": " + input.value
    socket.emit('send message', fullMessage);
    input.value = '';
  }
});


socket.on('send message', function(msg) {
    var newMessage = document.createElement('p');
    newMessage.textContent = msg;
    messages.appendChild(newMessage);
    // window.scrollTo(0, document.body.scrollHeight);

        // Automatically scroll down
        messages.scrollTop = messages.scrollHeight;
  });
