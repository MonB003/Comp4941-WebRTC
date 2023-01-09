let peerConnection;

const shareScreen4 = async () => {
    const mediaStream = await getLocalScreenCaptureStream();
    console.log("USER ID: " + thisUserID)
    console.log("1")

    const screenTrack = mediaStream.getVideoTracks()[0];
    console.log("2")
    console.log(screenTrack)

    if (screenTrack) {
        console.log("3")
        console.log('replace camera track with screen track');
        replaceTrack(screenTrack);
        console.log("4")

        socket.emit('before-screen-share', screenTrack);

        socket.emit('screen-share', thisUserID);
    }

    // When the button to stop screen sharing is clicked
    screenTrack.onended = () => {
        console.log("Screen sharing ended")
        // createVideoElement();
        console.log("END")

        socket.emit('after-screen-share', thisUserID);
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

    console.log("NEW TRACK: " + JSON.stringify(newTrack));
}

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



socket.on('before-screen-share', function (screenTrack) {
    console.log("BEFORE SCREEN SHARE")
    console.log("screenTrack: " + JSON.stringify(screenTrack))

    console.log("USER ID: " + thisUserID)

    // console.log(peersArray);
    // console.log("PEERS: " + JSON.stringify(peers));
    
    console.log("BEFORE END")
  });

  socket.on('after-screen-share', function (userSharingID) {
    console.log("AFTER SCREEN SHARE")
    console.log("USER ID: " + userSharingID)

    removeSharedVideoElement();
    createVideoElement();
    console.log("AFTER END")
  });















  async function captureScreen() {
    let mediaStream = null;
    try {
        mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always"
            },
            audio: false
        });

        let newVideo = document.createElement("video");
        newVideo.setAttribute("id", "screen" + thisUserID);
        newVideo.srcObject = mediaStream;
        document.body.appendChild(newVideo);
    } catch (ex) {
        console.log("Error occurred", ex);
    }
}