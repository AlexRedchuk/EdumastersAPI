const {Schema, model} = require('mongoose');

const schema = new Schema({
    _id: { type: Schema.Types.ObjectId },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
});

module.exports = model('Answer', schema);
