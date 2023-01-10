const button = document.querySelector('#create-btn');
button.href = `/room/${uuid.v4()}`

let thisUser = null;

function displayUsername() {
    thisUser = localStorage.getItem('USER');
    console.log("USER: " + thisUser)

    document.getElementById("thisUsername").innerHTML = "Welcome, " + thisUser;
}
displayUsername();


// document.getElementById("makeCallBtn").addEventListener("click", () => {
//     window.location.replace("/make-call.html");
// })

document.getElementById("messagingBtn").addEventListener("click", () => {
    // window.location.replace("/message.html");
    window.location.replace("/message");
})





// async function getCurrentUser() {
//     const postDetails = {
//         method: 'POST',
//         headers: {
//             "Content-Type": "application/json"
//         }
//     };

//     // Get session user
//     const postResponse = await fetch('/get-current-username', postDetails);
//     const jsonData = await postResponse.json();
//     let responsesStatus = jsonData.status; // Post owner userID

//     if (responsesStatus == "Success") {
//         document.getElementById("thisUsername").innerHTML = "Welcome, " + jsonData.username;
//         localStorage.setItem("USER", jsonData.username);
//     } 
// }
// getCurrentUser();



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

    console.log(JSON.stringify(resAllCalls))

    let currentCallsDiv = document.getElementById("currentCallsDiv");

    console.log("START FOR");
    for (let index = 0; index < resAllCalls.length; index++) {
        let currCall = resAllCalls[index];
        console.log(currCall);

        let newAnchor = document.createElement("a");
        newAnchor.href = `/room/${currCall}`
        newAnchor.innerHTML = currCall;

        currentCallsDiv.appendChild(newAnchor);
    }
    console.log("AFTER FOR");
}
showAllOpenCalls();