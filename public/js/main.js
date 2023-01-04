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
        document.getElementById("thisUsername").innerHTML = "Welcome, " + jsonData.username;
        localStorage.setItem("USER", jsonData.username);
    } 
}
getCurrentUser();

document.getElementById("messagingBtn").addEventListener("click", () => {
    window.location.replace("/message");
});



const button = document.querySelector('#create-btn');
button.href = `/room/${uuid.v4()}`




async function getOpenCalls() {
    console.log("GET OPEN CALLS")
    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    };

    // Get post owner's ID
    const postResponse = await fetch('/all-open-calls', postDetails);
    const jsonData = await postResponse.json();
    let responseCalls = jsonData.openCalls;

    for (let index = 0; index < responseCalls.length; index++) {
        let currCall = responseCalls[index];

        // Create HTML anchor element to store the current call
        let openCallBtn = document.createElement("a");
        openCallBtn.innerHTML = currCall.callID
        openCallBtn.setAttribute("id", currCall.id);
        openCallBtn.setAttribute("class", "open-call");
        openCallBtn.href = `/room/${openCallBtn.innerHTML}`;

        document.getElementById("currentCallsDiv").appendChild(openCallBtn);
    }

    // document.getElementById("currentCallsDiv").scrollTop = document.getElementById("currentCallsDiv").scrollHeight;
}
getOpenCalls();
