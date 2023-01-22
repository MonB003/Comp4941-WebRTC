document.getElementById('loginBtn').addEventListener('click', () => {
    let username = document.getElementById("username").value;
    if (username == "") {
        document.getElementById("errorMessage").innerHTML = "Please fill in the username field.";

    } else if (document.getElementById("password").value == "") {
        document.getElementById("errorMessage").innerHTML = "Please fill in the password field.";

    } else {
        var password = $('#password').val()
        fetch('/authenticate', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }).then((res) => {
            console.log(res)
            if (res.status == 200) {
                window.location.href = '/main'
            } else {
                document.getElementById("errorMessage").textContent = "Account not found.";
            }
        })
    }
})

document.getElementById("signup").addEventListener("click", () => {
    window.location.replace("/signup");
})