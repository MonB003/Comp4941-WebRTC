document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('signup').addEventListener( "click",() => {
        var email = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        console.log(email)
        console.log(password);
        fetch('/adduser', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password
            })
        }).then(() => {
            window.location.href = '/index.html'
        })
    })

})

