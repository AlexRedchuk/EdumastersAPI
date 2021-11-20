const {Schema, model} = require('mongoose');

const schema = new Schema({
    _id: { type: Schema.Types.ObjectId },
    text: { type: String, required: true },
    mark: { type: Number, required: true },
    answers: { type: Array, default: [] }
});

module.exports = model('Question', schema);
