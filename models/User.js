const {Schema, model} = require('mongoose');

const schema = new Schema({
    name: { type: String, required: true},
    surname: { type: String, required: true},
    nickname: { type: String, required: false, unique: true },
    photo: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, default: false }
});

module.exports = model('User', schema);
