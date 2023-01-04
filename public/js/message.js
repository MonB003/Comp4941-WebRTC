// Connects to socket io
var socket = io();

// Stores the current user
var userSending;

async function getCurrentUser() {
  const postDetails = {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    }
  };

  // Get post owner's ID
  const postResponse = await fetch('/get-current-username', postDetails);
  const jsonData = await postResponse.json();
  let responsesStatus = jsonData.status; // Post owner userID

  if (responsesStatus == "Success") {
    userSending = jsonData.username;
    console.log(userSending);
    document.getElementById("thisUsername").innerHTML = userSending + "'s messages";

  }
}
getCurrentUser();

document.getElementById("backButton").addEventListener("click", () => {
  window.location.replace("/main");
})

var form = document.getElementById('messageForm');
var input = document.getElementById('messageInput');
var messages = document.getElementById('allMessages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    let fullMessage = userSending + ": " + input.value
    socket.emit('send message', fullMessage);
    input.value = '';
  }
});


socket.on('send message', function (msg) {
  var newMessage = document.createElement('p');
  newMessage.textContent = msg;
  messages.appendChild(newMessage);
  // window.scrollTo(0, document.body.scrollHeight);

  // Automatically scroll down
  messages.scrollTop = messages.scrollHeight;
});