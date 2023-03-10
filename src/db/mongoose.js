const mongoose = require('mongoose')

// mongodb+srv://admin:<password>@cluster0.i1ubgrw.mongodb.net/test
// password: 1HoY7VICevfUI4KI
const uri = 'mongodb+srv://admin:1HoY7VICevfUI4KI@cluster0.i1ubgrw.mongodb.net/WebRTC4941';

mongoose.connect(uri, {
    useNewUrlParser: true,
})