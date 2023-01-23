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
    console.log("CALL OTHER USERS")
    otherUsers.forEach(userIdToCall => {
        const peer = createPeer(userIdToCall);
        peers[userIdToCall] = peer;
        thisUserID = userIdToCall;
        
        stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
        });
    });
}

function createPeer(userIdToCall) {
    console.log("CREATE PEER")
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.onnegotiationneeded = () => userIdToCall ? handleNegotiationNeededEvent(peer, userIdToCall) : null;
    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = (e) => {

        // Check if the user's video element does not exist (hasn't been appended to the page)
        if (document.getElementById(userIdToCall) == null) {
            console.log("ON TRACK")
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

            const pUsername = document.createElement("p");
            pUsername.textContent = thisUsername;
            pUsername.setAttribute("id", "username" + userIdToCall);
            pUsername.setAttribute("class", "remote-username");
            container.appendChild(pUsername);

            thisUserID = userIdToCall;
        }
    }
    return peer;
}

async function handleNegotiationNeededEvent(peer, userIdToCall) {
    console.log("HANDLE NEGOTIATION NEEDED EVENT")
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        userIdToCall,
    };

    socket.emit('peer connection request', payload);
}

async function handleReceiveOffer({ sdp, callerId }, stream) {
    console.log("HANDLE RECEIVE OFFER")
    const peer = createPeer(callerId);
    peers[callerId] = peer;
    const desc = new RTCSessionDescription(sdp);
    await peer.setRemoteDescription(desc);

    stream.getTracks().forEach(track => {
        peer.addTrack(track, stream);
    });

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    const payload = {
        userToAnswerTo: callerId,
        sdp: peer.localDescription,
    };

    // await storeUsernameAndID();

    socket.emit('connection answer', payload);
}


// async function storeUsernameAndID() {
//     const postDetails = {
//         method: 'POST',
//         headers: {
//             "Content-Type": "application/json"
//         }, body: JSON.stringify({
//             userID: thisUserID
//         })
//     };

//     // await fetch('/add-username-id-pair', postDetails);
//     // await postResponse.json();
    
//     const postResponse = await fetch('/add-username-id-pair', postDetails);
//     const jsonData = await postResponse.json();
//     let responsesStatus = jsonData.status; // Post owner userID

//     if (responsesStatus == "Success") {
//         console.log("SUCCESS")
//         // document.getElementById("thisUsername").innerHTML = "Welcome, " + jsonData.username;
//         // localStorage.setItem("USER", jsonData.username);
//     } else {
//         console.log("FAIL")
//     }
// }



function handleAnswer({ sdp, answererId }) {
    console.log("HANDLE ANSwER")
    const desc = new RTCSessionDescription(sdp);
    peers[answererId].setRemoteDescription(desc).catch(e => console.log(e));
}

function handleICECandidateEvent(e) {
    console.log("HANDLE ICE CAND EVENT")
    if (e.candidate) {
        Object.keys(peers).forEach(id => {
            const payload = {
                target: id,
                candidate: e.candidate,
            }
            socket.emit("ice-candidate", payload);
        });
    }
}

function handleReceiveIce({ candidate, from }) {
    console.log("HANDLE RECEIVE ICE")
    const inComingCandidate = new RTCIceCandidate(candidate);
    peers[from].addIceCandidate(inComingCandidate);
};

function handleDisconnect(userId) {
    console.log("HANDLE DISCONNECT")

    delete peers[userId];

    // Remove div element
    document.getElementById(userId).remove();

    // Remove video element
    document.getElementById("video"+userId).remove();
};


// Handles turning on/off video
toggleButton.addEventListener('click', () => {
    const videoTrack = userStream.getTracks().find(track => track.kind === 'video');
    if (videoTrack.enabled) {
        videoTrack.enabled = false;
        toggleButton.innerHTML = 'Show cam'
    } else {
        videoTrack.enabled = true;
        toggleButton.innerHTML = "Hide cam"
    }
});

remoteVideoContainer.addEventListener('click', (e) => {
    console.log("remoteVideoContainer CLICKED")
    if (e.target.innerHTML.includes('Hide')) {
        e.target.innerHTML = 'show remote cam';
        socket.emit('hide remote cam', e.target.getAttribute('user-id'));
    } else {
        e.target.innerHTML = `Hide user's cam`;
        socket.emit('show remote cam', e.target.getAttribute('user-id'));
    }
})

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
        audioTrack.enabled = false;
        toggleMicBtn.innerHTML = 'Turn on mic'
    } else {
        audioTrack.enabled = true;
        toggleMicBtn.innerHTML = "Turn off mic"
    }
});

async function init() {
    console.log("START INIT")
    socket.on('connect', async () => {
        console.log("CONNECT INIT")
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        userStream = stream;
        userVideo.srcObject = stream;

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



document.getElementById("leaveCallBtn").addEventListener("click", () => {
    window.location.replace("/main");
})


// When a user connects to the message page
socket.on("user-connected-sound", (roomId) => {
    console.log("CONNECTED SOUND CLIENT");

    // Makes a ping sound whenever a user joins the room
    let connectSound = new Audio("../sounds/ping.mp3");
    connectSound.play();

    // connectSound.pause();
});



var thisUsername;
async function getCurrentUser() {
    console.log("GET CURRENT USER")

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

    console.log(JSON.stringify(jsonData))

    if (responsesStatus == "Success") {
        // document.getElementById("thisUsername").innerHTML = jsonData.username;
        thisUsername = jsonData.username;
        // socket.emit('username-connected', thisUsername, roomId);
    } 
}
// getCurrentUser();

socket.on("username-connected", (username) => {
    console.log("CONNECTED USERNAME CLIENT");
    console.log(username)

    let pName = document.createElement("p");
    pName.textContent = username + " has joined the call.";
    document.getElementById("allMessages").appendChild(pName);
});


socket.on("store-username-id", (username, id) => {
    console.log("STORE USERNAME ID");
    console.log(username)
    console.log(id)
});
