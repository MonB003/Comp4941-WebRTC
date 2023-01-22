document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('loginBtn').addEventListener('click', () => {
        let username = document.getElementById("username").value;
        if (username == "") {
            document.getElementById("errorMessage").innerHTML = "Please fill in the username field.";
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
                    window.location.href = '/'
                }
            })
        }
    })

})