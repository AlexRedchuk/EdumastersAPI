const {Schema, model} = require('mongoose');

const schema = new Schema({
    mark: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    date: { type: Date, default: Date.now },
});

module.exports = model('TestResults', schema);
