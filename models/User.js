const {Schema, model} = require('mongoose');

const schema = new Schema({
    name: { type: String, required: true},
    surname: { type: String, required: true},
    nickname: { type: String, required: false, unique: false },
    photo: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, default: true }
});

module.exports = model('User', schema);
