const {Schema, model} = require('mongoose');
const Categories = require('./Categories');

const schema = new Schema({
    name: { type: String, required: true},
    category: { type: Schema.Types.ObjectId, ref: 'Categories' },
    difficulty: { type: Number, min: 1, max: 5 },
    owner: { type: Schema.Types.ObjectId, ref: 'User'},
    grand_total: { type: Number },
    questions: { type: Array, default: [] }
});

module.exports = model('Test', schema);
