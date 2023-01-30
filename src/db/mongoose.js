const mongoose = require('mongoose')

// const uri = 'mongodb+srv://admin:1HoY7VICevfUI4KI@cluster0.i1ubgrw.mongodb.net/test';
// const uri = 'mongodb+srv://admin:1HoY7VICevfUI4KI@cluster0.i1ubgrw.mongodb.net/?retryWrites=true&w=majority';
// const uri = 'mongodb+srv://admin:1HoY7VICevfUI4KI@cluster0.i1ubgrw.mongodb.net/WebRTC4941';
const uri = 'mongodb+srv://WebRTC4941:WebRTC4941@WebRTC4941.8kp4hfj.mongodb.net/WebRTC4941';

// mongodb+srv://admin:<password>@cluster0.i1ubgrw.mongodb.net/test
// password: 1HoY7VICevfUI4KI
mongoose.connect(uri, {
    useNewUrlParser: true,
})
// mongoose.connect(uri)
