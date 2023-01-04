async function signupUser() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    const dataSent = {
        username, 
        password
    };

    const postDetails = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataSent)
    };

    // Get post owner's ID
    const postResponse = await fetch('/signup', postDetails);
    const jsonData = await postResponse.json();
    let responsesStatus = jsonData.status; // Post owner userID

    if (responsesStatus == "Success") {
        window.location.replace("/main");
    } else {
        document.getElementById("errorMessage").innerHTML = jsonData.msg;
    }
}