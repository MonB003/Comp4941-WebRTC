// document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signup').addEventListener( "click",() => {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        console.log(username)
        console.log(password);
        fetch('/adduser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: password
            })
        }).then(() => {
            // window.location.href = '/index.html'
            window.location.replace("/main");
        })
    })


    document.getElementById("backToLogin").addEventListener("click", () => {
        window.location.replace("/");
    });

// })

