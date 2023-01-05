const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true
    }
})

const users = mongoose.model('users', UserSchema)

module.exports = users