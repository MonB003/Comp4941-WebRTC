// document.getElementById("loginBtn").addEventListener("click", () => {
//     let username = document.getElementById("username").value;
//     if (username == "") {
//         document.getElementById("errorMessage").innerHTML = "Please fill in the username field.";

//     } else {
//         localStorage.setItem('USER', username);
//         window.location.replace("/main.html");
//     }

// })

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('loginBtn').addEventListener('click', () => {
        let username = document.getElementById("username").value;
        if (username == "") {
            document.getElementById("errorMessage").innerHTML = "Please fill in the username field.";
        } else {
        localStorage.setItem('USER', username);
        var password = $('#password').val()
        fetch('/authenticate', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: username,
                password: password
            })
        }).then((res) => {
            console.log(res)
            if (res.status == 200) {
                window.location.href = '/main'
            } else {
                window.location.href = '/'
            }
        })
        }
    })
        
})
