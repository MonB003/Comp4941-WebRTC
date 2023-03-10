const peers = {};
const chatContainer = document.getElementById('left');
const remoteVideoContainer = document.getElementById('right');
const toggleButton = document.getElementById('toggle-cam');
const toggleMicBtn = document.getElementById('toggle-microphone');

const roomId = window.location.pathname.split('/')[2];
const userVideo = document.getElementById('user-video');
let userStream;
const socket = io('/');

let thisUserID = null;


function callOtherUsers(otherUsers, stream) {
    // Add each of the others user's videos to the screen
    otherUsers.forEach(userIdToCall => {
        const peer = createPeer(userIdToCall); // Create a peer connection
        peers[userIdToCall] = peer;     // Store user's ID in the peers array

        stream.getTracks().forEach(track => {
            // Add new media track to the set of tracks passed to the other peers
            peer.addTrack(track, stream);
        });
    });
}

// Creates a peer connection
function createPeer(userIdToCall) {
    // Creates a WebRTC connection between the local computer and a remote peer
    const peer = new RTCPeerConnection({
        iceServers: [{ 
            urls: "stun:stun.stunprotocol.org"  // STUN server
        }]
    });

    // When connection negotiation through the signaling channel is required
    peer.onnegotiationneeded = () => userIdToCall ? handleNegotiationNeededEvent(peer, userIdToCall) : null;

    // When an RTCIceCandidate has been identified and added to the local peer
    peer.onicecandidate = handleICECandidateEvent;

    // Event handler on RTCPeerConnection after a new track has been added
    peer.ontrack = (e) => {
        // Check if the user's video element does not exist (hasn't been appended to the page)
        if (document.getElementById(userIdToCall) == null) {
            // Create video element of the user
            const container = document.createElement('div');
            container.classList.add('remote-video-container');
            
            const video = document.createElement('video');
            video.setAttribute("id", "video" + userIdToCall); // Give video element an ID (used later when user leaves call)
            video.srcObject = e.streams[0];
            video.autoplay = true;
            video.playsInline = true;
            video.classList.add("remote-video");
            container.appendChild(video);
            container.id = userIdToCall;
            remoteVideoContainer.appendChild(container);
        }
    }

    // Return the created peer (WebRTC connection)
    return peer;
}

// Handle negotiation and create an offer
async function handleNegotiationNeededEvent(peer, userIdToCall) {
    const offer = await peer.createOffer();     // Create SDP offer for starting a new WebRTC connection to a remote peer
    await peer.setLocalDescription(offer);      // Description specifies the properties of the local end of the connection
    
    // Offer information
    const payload = {
        sdp: peer.localDescription,
        userIdToCall,
    };

    socket.emit('peer connection request', payload);
}

// Receive the offer
async function handleReceiveOffer({
    sdp,
    callerId
}, stream) {

    const peer = createPeer(callerId);  // Create peer
    peers[callerId] = peer;     // Store in the array of all peers in the call
    const desc = new RTCSessionDescription(sdp);    // Setup one end of a connection and it's configuration
    await peer.setRemoteDescription(desc);      // Set the specified session description as the remote peer’s current offer

    stream.getTracks().forEach(track => {
        // Add new media track to the set of tracks passed to the other peers
        peer.addTrack(track, stream);
    });

    const answer = await peer.createAnswer();   // Create an answer to the offer
    await peer.setLocalDescription(answer);     // Description specifies the properties of the local end of the connection

    // Answer information
    const payload = {
        userToAnswerTo: callerId,
        sdp: peer.localDescription,
    };

    socket.emit('connection answer', payload);
}


// Handle the answer
function handleAnswer({
    sdp,
    answererId
}) {

    const desc = new RTCSessionDescription(sdp);    // Setup one end of a connection and it's configuration
    peers[answererId].setRemoteDescription(desc).catch(e => console.log(e));     // Set specified session description as remote peer’s current answer
}

// ICE candidate event
function handleICECandidateEvent(e) {
    // Check for an existing candidate
    if (e.candidate) {
        // Loop through each peer's ID (key in the key/value pair)
        Object.keys(peers).forEach(id => {
            // Stores who is sending and receiving
            const payload = {
                target: id,
                candidate: e.candidate,
            }
            socket.emit("ice-candidate", payload);
        });
    }
}

// Receive ICE candidate
function handleReceiveIce({
    candidate,
    from
}) {
    const inComingCandidate = new RTCIceCandidate(candidate); // Ice candidate used to establish an RTCPeerConnection
    peers[from].addIceCandidate(inComingCandidate);     // Adds this new remote candidate to the RTCPeerConnection's remote description
};

// When a user disconnects
function handleDisconnect(userId) {
    // Remove user from the peers array
    delete peers[userId];  

    // Remove div element from the page
    document.getElementById(userId).remove();

    // Remove video element
    document.getElementById("video" + userId).remove();
};


// Handles turning on/off video
toggleButton.addEventListener('click', () => {
    const videoTrack = userStream.getTracks().find(track => track.kind === 'video');
    if (videoTrack.enabled) {
        // Turn camera off
        videoTrack.enabled = false;
        toggleButton.innerHTML = 'Show cam'
    } else {
        // Turn camera on
        videoTrack.enabled = true;
        toggleButton.innerHTML = "Hide cam"
    }
});


// Handles turning on/off camera
function hideCam() {
    const videoTrack = userStream.getTracks().find(track => track.kind === 'video');
    videoTrack.enabled = false;
}

function showCam() {
    const videoTrack = userStream.getTracks().find(track => track.kind === 'video');
    videoTrack.enabled = true;
}


// Handles turning on/off mic
toggleMicBtn.addEventListener('click', () => {
    const audioTrack = userStream.getTracks().find(track => track.kind === 'audio');
    if (audioTrack.enabled) {
        // Turn mic off
        audioTrack.enabled = false;
        toggleMicBtn.innerHTML = 'Turn on mic'
    } else {
        // Turn mic on
        audioTrack.enabled = true;
        toggleMicBtn.innerHTML = "Turn off mic"
    }
});



// Initial setup when the page is loaded
async function init() {
    socket.on('connect', async () => {
        // Setup camera and microphone through prompting user for permission to access their video/audio
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        userStream = stream;
        userVideo.srcObject = stream;   // Setup user's video on the page

        socket.emit('user joined room', roomId);

        socket.emit('user-connected-sound', roomId);

        socket.emit('username-connected', thisUsername, roomId);

        socket.emit('store-username-id', thisUsername);

        socket.on('all other users', (otherUsers) => callOtherUsers(otherUsers, stream));

        socket.on("connection offer", (payload) => handleReceiveOffer(payload, stream));

        socket.on('connection answer', handleAnswer);

        socket.on('ice-candidate', handleReceiveIce);

        socket.on('user disconnected', (userId) => handleDisconnect(userId));

        socket.on('server is full', () => alert("chat is full"));
    });
}
getCurrentUser();
init();





var usernameAndIdsArray;
socket.on("get-all-users", (usernameAndIds) => {
    usernameAndIdsArray = usernameAndIds;
});

document.getElementById("leaveCallBtn").addEventListener("click", () => {
    window.location.replace("/main");
})


// When a user connects to the message page
socket.on("user-connected-sound", (roomId) => {
    // Makes a ping sound whenever a user joins the room
    let connectSound = new Audio("../sounds/ping.mp3");
    connectSound.play();
});



var thisUsername;
async function getCurrentUser() {
    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    };

    // Get session user
    const postResponse = await fetch('/get-current-username', postDetails);
    const jsonData = await postResponse.json();
    let responsesStatus = jsonData.status;

    if (responsesStatus == "Success") {
        thisUsername = jsonData.username;
    }
}

// Display message when user connects
socket.on("username-connected", (username) => {
    let pName = document.createElement("p");
    pName.textContent = username + " has joined the call.";
    document.getElementById("allMessages").appendChild(pName);
});


socket.on("store-username-id", (username, id) => {
    thisUsername = username;
    thisUserID = id;
});


socket.on("get-other-users", (usernameAndIds) => {
    usernameAndIds.forEach(user => {
        let currUserID = user.ID;
        let parID = String("username" + currUserID);
        let currPar = document.getElementById(parID);

        // Get element with this ID and change text content
        if (currPar != null) {
            document.getElementById("username" + currUserID).textContent = user.username;

        } else {
            document.getElementById("hostUsername").textContent = user.username;
        }
    })
});
