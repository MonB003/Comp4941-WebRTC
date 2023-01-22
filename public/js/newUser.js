document.getElementById('signup').addEventListener( "click", async () => {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (username == "") {
        document.getElementById("errorMessage").innerHTML = "Please fill in the username field.";

    } else if (password == "") {
        document.getElementById("errorMessage").innerHTML = "Please fill in the password field.";

    } else {
        const postDetails = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        };

        const postResponse = await fetch('/adduser', postDetails);
        const jsonData = await postResponse.json();
        let resSuccess = jsonData.success; 

        if (resSuccess == false) {
            document.getElementById("errorMessage").innerHTML = jsonData.message;
        } else {
            window.location.replace("/main");
        }
    }
})


document.getElementById("backToLogin").addEventListener("click", () => {
    window.location.replace("/");
});
