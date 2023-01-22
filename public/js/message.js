// Connects to socket io
var socket = io();

// Stores the current user
var userSending = null; 

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
      document.getElementById("thisUsername").innerHTML = jsonData.username + "'s messages";
      userSending = jsonData.username;
  } 
}
getCurrentUser();


document.getElementById("backButton").addEventListener("click", () => {
    window.location.replace("/main");
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

        // Automatically scroll down
        messages.scrollTop = messages.scrollHeight;
  });
