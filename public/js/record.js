window.onload = function() {
    const parts = []; //keep track of data
    let mediaRecorder;

    navigator.mediaDevices.getUserMedia({ audio: true, video: true}).then(stream => {
        document.getElementById("user-video").srcObject = stream;

        document.getElementById("startBtn").onclick = function() {
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.start(1000);

            mediaRecorder.ondataavailable = function(e) {
                // Contains data in stream
                parts.push(e.data);
            }
        }

        document.getElementById("stopBtn").onclick = function() {
            // Stop recording
            mediaRecorder.stop();

            // Creates a file out of data
            // Binary blob that holds file
            const blob = new Blob(parts, {
                type: "video/webm"
            });

            // Create URL out of blob
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            document.body.appendChild(anchor);
            anchor.style = "display: none";
            anchor.href = url;
            anchor.download = "test.webm";
            anchor.click(); // Will start download process
        }
    });
}