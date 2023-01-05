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
    window.location.replace("/message.html");
})