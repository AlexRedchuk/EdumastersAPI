const { Router } = require('express');
const router = Router();
const TestResults = require('../models/TestResults');
const Test = require('../models/Test');
const User = require('../models/User');
const decodeUserId = require('../utils/decodeToken');
const Schema = require('mongoose');
const _ = require('lodash');

router.post(
    '/add',
    async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const userId = decodeUserId(token);
        const currentUser = await User.findOne({_id: userId});
        const { mark, testId, answers } = req.body;
        const test = await Test.findOne({_id: testId}).populate({
            path: 'questions',
            model: 'Question',
            populate: {
                path: 'answers',
                model: 'Answer'
              } 
        });
        let testResult = 0;
        const questionsMap = test.questions.map((question, index) => {
            let isCorrect = question.answers.find(el => el._id.toString() === answers[index]);
            const answersMap = question.answers.map((answer) => {
                const isChosen = answer._id.toString() === answers[index] ? true : false;
                if(answer.isCorrect === false && isChosen) {
                    isCorrect = false;
                }
                return { 
                    _id: answer._id,
                    test: answer.text,
                    isCorrect: answer.isCorrect,
                    isChosen: isChosen
                }
            })
            testResult += isCorrect ? question.mark : 0;
            return {
                _id: question._id,
                test: question.text,
                mark: question.mark,
                answers: answersMap
            }
        })
        const object = {
            mark: mark,
            testResult: testResult,
            user: currentUser._id,
            mark: testResult,
            maxMark: test.grand_total,
            testResultSummary: {
                name: test.name,
                category: test.category,
                difficulty: test.difficulty,
                owner: test.owner,
                questions: questionsMap
            }
        }
        await TestResults.create(object, (error, data)=> {
            if (error) {
               return next(error)
            }
            else {
                res.status(201).json(data);
            }
        })
       

    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});

router.get('/getUserTests', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userId = decodeUserId(token);
    const result = await TestResults.find({
        user: userId
    })
    res.status(201).json(result);
});

router.get('/getUserMarkSummary', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userId = decodeUserId(token);
    const result = await TestResults.aggregate([
        {
            $match: {
                user: { $eq: Schema.Types.ObjectId(userId) }
            }
        },
        {
        $group: {
            _id: userId,
            exp: {
                $sum: "$mark"
            }
        }  
    }
        
    ])
    res.status(201).json(result[0]);
})

router.get('/getFilteredByUser', async (req, res) => {
    const { pageSize, page, categoryId, searchWord } = req.query;
    const difficulties = req.query.difficulties ? JSON.parse(req.query.difficulties) : [];
    const token = req.headers.authorization.split(' ')[1];
    const userId = decodeUserId(token);
    let data = null;
    if(categoryId) {
        data = await TestResults.find(
            {
                $and: [
                    {
                        "user": userId
                    },
                    {
                        "testResultSummary.name" : {$regex : `.*${searchWord ? searchWord : ''}.*`, $options: 'i' }
                    },
                    {
                        "testResultSummary.difficulty": { $in: !_.isEmpty(difficulties) ? difficulties : [1, 2, 3, 4, 5] }
                    },
                    {
                        "testResultSummary.category": categoryId
                    }
                ]
            }
            
        ).limit(parseInt(pageSize)).skip(parseInt(page-1) * parseInt(pageSize));
    }
    else {
        data = await TestResults.find(
            {
                $and: [
                    {
                        "user": userId
                    },
                    {
                        'testResultSummary.name': { $regex: `.*${searchWord ? searchWord : ''}.*`, $options: 'i' }
                    },
                    {
                        "testResultSummary.difficulty": { $in: !_.isEmpty(difficulties) ? difficulties : [1, 2, 3, 4, 5] }
                    }
                ]
            }
            
        ).limit(parseInt(pageSize)).skip(parseInt(page-1) * parseInt(pageSize));
    }
    const response = {
        items: data,
        page_info: {
            totalPages: Math.trunc(data.length / pageSize) + 1,
            pageSize: pageSize,
            currentPage: page
        }
    }
    res.json(response);
})


module.exports = router;