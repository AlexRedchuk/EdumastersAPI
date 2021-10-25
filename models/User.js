const {Schema, model} = require('mongoose');

const schema = new Schema({
    name: { type: String, required: true},
    photo: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false}
});

module.exports = model('User', schema);
