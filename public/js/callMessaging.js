var userSending = null;

var form = document.getElementById('messageForm');
var input = document.getElementById('messageInput');
var messages = document.getElementById('allMessages');

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
    } 
}
getCurrentUser();


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