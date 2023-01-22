const button = document.querySelector('#create-btn');
button.href = `/room/${uuid.v4()}`

let thisUser = null;


document.getElementById("messagingBtn").addEventListener("click", () => {
    window.location.replace("/message");
})


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

    console.log(JSON.stringify(jsonData))

    if (responsesStatus == "Success") {
        document.getElementById("thisUsername").innerHTML = "Welcome, " + jsonData.username;
        thisUser = jsonData.username;
        console.log(thisUser)
    } 
}
getCurrentUser();


async function showAllOpenCalls() {
    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        }
    };

    const postResponse = await fetch('/get-call-ids', postDetails);
    const jsonData = await postResponse.json();
    let resAllCalls = jsonData.callIDs; // All call IDs from response

    let currentCallsDiv = document.getElementById("currentCallsDiv");

    for (let index = 0; index < resAllCalls.length; index++) {
        let currCall = resAllCalls[index];
        console.log(currCall);

        let newAnchor = document.createElement("a");
        newAnchor.href = `/room/${currCall}`
        newAnchor.innerHTML = currCall;

        currentCallsDiv.appendChild(newAnchor);
    }
}
showAllOpenCalls();