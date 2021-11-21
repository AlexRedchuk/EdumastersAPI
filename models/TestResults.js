const {Schema, model} = require('mongoose');

const schema = new Schema({
    mark: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    maxMark: { type: Number, required: true },
    testResultSummary: {
        name: { type: String },
        category: { type: Schema.Types.ObjectId, ref: 'Categories' },
        difficulty: { type: Number, min: 1, max: 5 },
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        questions: [ {
            text: { type: String },
            mark: { type: Number },
            answers: [{
                text: { type: String },
                isCorrect: { type: Boolean },
                isChosen: { type: Boolean }
             }
            ]
        }]
    },
    date: { type: Date, default: Date.now },
});

module.exports = model('TestResults', schema);
