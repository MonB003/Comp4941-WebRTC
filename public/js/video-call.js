const peers = {};
var peersArray = new Array();
const chatContainer = document.getElementById('left');
const remoteVideoContainer = document.getElementById('right');
const toggleButton = document.getElementById('toggle-cam');
const toggleMicBtn = document.getElementById('toggle-microphone');

const roomId = window.location.pathname.split('/')[2];
const userVideo = document.getElementById('user-video');
let userStream;
const socket = io('/');

let thisUserID = null;

var userCount = 0;




const senders = []; // SCREEN SHARING



function callOtherUsers(otherUsers, stream) {
    console.log("CALL OTHER USERS")
    otherUsers.forEach(userIdToCall => {
        console.log("USER ID TO CALL: " + userIdToCall)
        const peer = createPeer(userIdToCall);
        console.log("CREATING PEER: " + peer)
        peers[userIdToCall] = peer;
        thisUserID = userIdToCall;
        stream.getTracks().forEach(track => {
            console.log("ADDING TRACK: " + track)
            peer.addTrack(track, stream);



            // senders.push(peer);  // SCREEN SHARING
            senders.push(track);
        });

        console.log("NUM OF PEERS ARRAY: " + JSON.stringify(peers));

        console.log(Object.keys(peers).length);

        peersArray.push(userIdToCall);
        // userCount++;
        userCount += 2;
    });
    console.log(peersArray);
    console.log(peersArray.length);
    console.log("USER COUNT", userCount)
}

function createPeer(userIdToCall) {
    console.log("CREATE PEER")
    const peer = new RTCPeerConnection({
        iceServers: [{
            urls: "stun:stun.stunprotocol.org"
        }]
    });
    peer.onnegotiationneeded = () => userIdToCall ? handleNegotiationNeededEvent(peer, userIdToCall) : null;
    console.log("USER ID TO CALL: " + userIdToCall)
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

async function handleReceiveOffer({
    sdp,
    callerId
}, stream) {
    console.log("HANDLE RECEIVE OFFER")
    const peer = createPeer(callerId);
    peers[callerId] = peer;
    // console.log("NUM OF PEERS ARRAY: " + peers);
    // console.log("NUM OF PEERS ARRAY: " + JSON.stringify(peers));


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




    peerConnection = peer;
    console.log("PEER CONN: " + peerConnection)

    socket.emit('connection answer', payload);
}

function handleAnswer({
    sdp,
    answererId
}) {
    console.log("HANDLE ANSwER")
    const desc = new RTCSessionDescription(sdp);
    peers[answererId].setRemoteDescription(desc).catch(e => console.log(e));
    // console.log("NUM OF PEERS ARRAY: " + peers);
    // console.log("NUM OF PEERS ARRAY: " + JSON.stringify(peers));
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

function handleReceiveIce({
    candidate,
    from
}) {
    console.log("HANDLE RECEIVE ICE")
    const inComingCandidate = new RTCIceCandidate(candidate);
    peers[from].addIceCandidate(inComingCandidate);
    // console.log("NUM OF PEERS ARRAY: " + peers);
    // console.log("NUM OF PEERS ARRAY: " + JSON.stringify(peers));
};


function handleDisconnect(userId) {
    console.log("HANDLE DISCONNECT")

    // delete peers[userId];
    // console.log("USER ID: " + userId);

    userCount--;
    console.log("USER COUNT", userCount)

    // &&
    let checkOnlyHost = peersArray.length == 1 || peersArray.includes("HOST");
    console.log("HOST BOOLEAN: " + checkOnlyHost)

    if (userCount == 0 || checkOnlyHost) {
        console.log("USER COUNT IS 0")
        let urlPath = window.location.pathname;
        let roomString = "/room/"
        console.log(urlPath);
        let callID = urlPath.split(roomString).pop();
        console.log(callID)
        updateCallStatusDB(callID);
    }


    delete peers[userId];
    console.log("USER ID: " + userId);

    // Remove video element
    // document.getElementById("video" + userId).remove();

    // Remove div element
    // let userDiv = document.getElementById(userId);
    // $(userDiv).remove();
    document.getElementById(userId).remove();



    console.log("NUM OF PEERS ARRAY: " + peers);
    console.log("NUM OF PEERS ARRAY: " + JSON.stringify(peers));
    console.log(peersArray);
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

// remoteVideoContainer.addEventListener('click', (e) => {
//     console.log("remoteVideoContainer CLICKED")
//     if (e.target.innerHTML.includes('Hide')) {
//         e.target.innerHTML = 'show remote cam';
//         socket.emit('hide remote cam', e.target.getAttribute('user-id'));
//     } else {
//         e.target.innerHTML = `Hide user's cam`;
//         socket.emit('show remote cam', e.target.getAttribute('user-id'));
//     }
// })

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
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        if (!peersArray.includes("HOST")) {
            peersArray.push("HOST");
        }
        userStream = stream;
        userVideo.srcObject = stream;
        saveCallInDB();
        // userCount++;
        userCount += 2;
        console.log("USER COUNT", userCount)

        socket.emit('user joined room', roomId);

        socket.on('all other users', (otherUsers) => callOtherUsers(otherUsers, stream));

        socket.on("connection offer", (payload) => handleReceiveOffer(payload, stream));

        socket.on('connection answer', handleAnswer);

        socket.on('ice-candidate', handleReceiveIce);

        socket.on('user disconnected', (userId) => handleDisconnect(userId));

        socket.on('server is full', () => alert("chat is full"));
    });
}

init();




async function saveCallInDB() {
    let urlPath = window.location.pathname;
    let roomString = "/room/"
    console.log(urlPath);
    let callID = urlPath.split(roomString).pop();
    console.log(callID)

    const dataSent = {
        callID
    };

    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataSent)
    };

    // Get post owner's ID
    const postResponse = await fetch('/save-call-in-database', postDetails);
    const jsonData = await postResponse.json();
    let responsesStatus = jsonData.status;

    if (responsesStatus == "Fail") {
        // document.getElementById("errorMessage").innerHTML = jsonData.msg;
        console.log("STATUS FAIL")
    }
}


async function updateCallStatusDB(callID) {
    // let urlPath = window.location.pathname;
    // let roomString = "/room/"
    // console.log(urlPath);
    // let callID = urlPath.split(roomString).pop();
    // console.log(callID)

    const dataSent = {
        callID
    };

    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataSent)
    };

    // Get post owner's ID
    const postResponse = await fetch('/update-call-status', postDetails);
    const jsonData = await postResponse.json();
    let responsesStatus = jsonData.status;

    if (responsesStatus == "Fail") {
        // document.getElementById("errorMessage").innerHTML = jsonData.msg;
        console.log("STATUS FAIL")
    }
}



document.getElementById("leaveCallBtn").addEventListener("click", () => {
    window.location.replace("/main");
});



// NOT WORKING
// Supposed to swap between user video and screen share
function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({
        cursor: true
    }).then(stream => {
        const screenTrack = stream.getTracks()[0];
        console.log("SCREEN TRACK: " + screenTrack)

        // senders.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
        let test = senders.find(sender => sender.track.kind === 'video')
        console.log("TEST: " + test)

        // userStream.addTrack(screenTrack);
        // userVideo.srcObject = userStream;
        userVideo.srcObject = userStream;



        // const screenTrack = stream.getVideoTracks()[0];
        // console.log("2")
        // console.log(screenTrack)
        // if (screenTrack) {
        //     console.log("3")
        //     console.log('replace camera track with screen track');
        //     replaceTrack(screenTrack);
        //     console.log("4")
        // }

        screenTrack.onended = function () {
            senders.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
        }
    })
}





// ONLY SHOWS ON THAT USERS SCREEN
async function shareScreen3() {
    const mediaStream = await getLocalScreenCaptureStream();
    console.log("1")

    const screenTrack = mediaStream.getVideoTracks()[0];
    console.log("2")
    console.log(screenTrack)

    if (screenTrack) {
        console.log("3")
        console.log('replace camera track with screen track');


        let screenVideo = document.createElement("video");
        screenVideo.id = "screen" + thisUserID;
        screenVideo.autoplay = true;
        screenVideo.srcObject = mediaStream;
        document.body.appendChild(screenVideo);

        console.log("CLIENT SEND")
        console.log(JSON.stringify(screenVideo))
        socket.emit('send-message-to-group', screenVideo);
        console.log("4")
    }



    // socket.emit('send-message-to-group', "TESTING");
    // socket.emit('send-message-to-group', mediaStream);



    // When the button to stop screen sharing is clicked
    screenTrack.onended = () => {
        console.log("Screen sharing ended")

        let screenVideo = document.getElementById("screen" + thisUserID);
        document.body.removeChild(screenVideo);
    }
};






let peerConnection;

// SHOWS ON ALL USERS SCREENS EXCEPT THE USER SHARING
// After screen share ends, the video just says there paused 
const shareScreen2 = async () => {
    const mediaStream = await getLocalScreenCaptureStream();
    console.log("1")

    const screenTrack = mediaStream.getVideoTracks()[0];
    console.log("2")
    console.log(screenTrack)

    if (screenTrack) {
        console.log("3")
        console.log('replace camera track with screen track');
        replaceTrack(screenTrack);
        console.log("4")
    }

    // When the button to stop screen sharing is clicked
    screenTrack.onended = () => {
        console.log("Screen sharing ended")

        // removeScreen();

        // replaceTrack(userStream.current.getTracks()[1]);
        replaceTrack(userStream);

        console.log("END")
    }

};

const getLocalScreenCaptureStream = async () => {
    try {
        const constraints = {
            video: {
                cursor: 'always'
            },
            audio: false
        };
        const screenCaptureStream = await navigator.mediaDevices.getDisplayMedia(constraints);

        return screenCaptureStream;
    } catch (error) {
        console.error('failed to get local screen', error);
    }
};

const replaceTrack = (newTrack) => {
    const sender = peerConnection.getSenders().find(sender =>
        sender.track.kind === newTrack.kind
    );

    console.log("SENDER: " + JSON.stringify(sender))
    console.log("NEW TRACK KIND: " + newTrack.kind)

    if (!sender) {
        console.warn('failed to find sender');

        return;
    }

    sender.replaceTrack(newTrack);
}

const stopScreenShare = () => {
    // if (!localVideo.srcObject) return;

    for (const sender of peerConnection.getSenders()) {
        sender.track.stop();
    }
};


//   async function removeScreen() {
//     const constraints = { video: true, audio: false };
//     const mediaStream = await navigator.mediaDevices.getDisplayMedia(constraints);

//     const screenTrack = mediaStream.getVideoTracks()[0];
//     console.log("2")
//     console.log(screenTrack)

//     if (screenTrack) {
//         console.log("3")
//       console.log('replace camera track with screen track');
//       replaceTrack(screenTrack);
//       console.log("4")
//     }
//   }

async function removeScreen() {
    // const constraints = { video: true, audio: false };
    // await navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    //     userVideo.srcObject = stream;
    //     userVideo.play();
    // });

    console.log("1")

    // for (const track of userVideo.srcObject.getTracks()) {
    //     console.log('stop track', track);
    //     track.stop();
    //   }

    for (const sender of peerConnection.getSenders()) {
        sender.track.stop();
    }


    // const stream = await navigator.mediaDevices.getUserMedia({
    //     video: true,
    //     audio: true
    // });

    userVideo.srcObject = userStream;

    document.getElementById("video" + thisUserID).srcObject = userStream;

    console.log("2")
}





// socket.on('send-message-to-group', function (msg) {
//     var newMessage = document.createElement('p');
//     newMessage.textContent = msg;
//     document.body.appendChild(newMessage);
//   });

// socket.on('send-message-to-group', async function () {
//     const mediaStream = await getLocalScreenCaptureStream();

//     let screenVideo = document.createElement("video");
//     screenVideo.id = "screen" + thisUserID;
//     screenVideo.autoplay = true;
//     screenVideo.srcObject = mediaStream;
//     document.body.appendChild(screenVideo);
//   });


// socket.on('send-message-to-group', function (mediaStream) {
//     let screenVideo = document.createElement("video");
//     screenVideo.id = "screen" + thisUserID;
//     screenVideo.autoplay = true;
//     screenVideo.srcObject = mediaStream;
//     document.body.appendChild(screenVideo);
//   });

socket.on('send-message-to-group', function (screenVideo) {
    console.log("CLIENT SOCKET SEND")
    console.log(JSON.stringify(screenVideo))
    // document.body.appendChild(screenVideo);
    document.body.append(screenVideo);
  });






  socket.on('after-screen-share', function (userSharingID) {
    console.log("AFTER SCREEN SHARE")
    console.log("USER ID: " + userSharingID)

    removeSharedVideoElement();
    createVideoElement();
    console.log("AFTER END")
  });


  // After screen share ends, the video just says there paused 
const shareScreen4 = async () => {
    const mediaStream = await getLocalScreenCaptureStream();
    console.log("1")

    const screenTrack = mediaStream.getVideoTracks()[0];
    console.log("2")
    console.log(screenTrack)

    if (screenTrack) {
        console.log("3")
        console.log('replace camera track with screen track');
        replaceTrack(screenTrack);
        console.log("4")
    }

    // When the button to stop screen sharing is clicked
    screenTrack.onended = () => {
        console.log("Screen sharing ended")
        // createVideoElement();
        console.log("END")

        socket.emit('after-screen-share', thisUserID);
    }
};



function removeSharedVideoElement() {
    // document.getElementById("video" + thisUserID).remove();
    document.getElementById(thisUserID).remove();
    console.log("REMOVED VIDEO ELEMENT")
}


async function createVideoElement() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    });

    const container = document.createElement('div');
    container.classList.add('remote-video-container');
    const video = document.createElement('video');
    video.setAttribute("id", "video" + thisUserID); // Give video element an ID (used later when user leaves call)
    // video.srcObject = e.streams[0];
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.classList.add("remote-video");
    container.appendChild(video);
    container.id = thisUserID;
    remoteVideoContainer.appendChild(container);

    console.log("CREATED VIDEO ELEMENT")
}