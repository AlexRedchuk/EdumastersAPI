const { Router } = require('express');
const router = Router();
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Test = require('../models/Test');
const mongoose = require('mongoose');
const _ = require('lodash');

// api/test/add
router.post(
    '/add',
    async (req, res, next) => {
    try {
        const { questions } = req.body;
        const questionIds = [];
        let grand_total = 0;
        await questions.forEach(async question => {
            const { answers } = question;
            const array = [];
            await answers.forEach(async el => {
                const id = mongoose.Types.ObjectId();
                await Answer.create({
                    _id: id,
                    text: el.text,
                    isCorrect: el.isCorrect
                }, (error, data) => {
                    if (error) {
                       return next(error)
                    }
                });
                array.push(id);
            })
            const id = mongoose.Types.ObjectId();
            await Question.create({
                _id: id,
                mark: question.mark,
                text: question.text,
                answers: array
            }, (error, data) => {
                if (error) {
                   return next(error)
                }
            });
            grand_total += question.mark;
            questionIds.push(id);
        });
        await Test.create({
            name: req.body.name,
            category: req.body.category,
            difficulty: req.body.difficulty,
            owner: req.body.owner,
            questions: await questionIds,
            grand_total: await grand_total
        }, (error, data) => {
            if (error) {
               return next(error)
            }
            else {
                res.status(201).json(data);
            }
        })
       

    } catch (e) {
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});

// api/test/get
router.get('/get', async (req, res) => {
    try {
        const data = await Test.find({}, (err, data) => {
            if(err) {
                console.log(err);
            }
        }).populate([{ 
            path: 'questions',
            model: 'Question',
            populate: {
              path: 'answers',
              model: 'Answer'
            } 
           
         },  {
            path: 'category',
            model: 'Categories'
        }]);
         res.json(data);
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});


// api/test/getFiltered
router.get('/getFiltered', async (req, res) => {
    try {
        const { pageSize, page, categoryId, searchWord } = req.query;
        const difficulties = req.query.difficulties ? JSON.parse(req.query.difficulties) : null;
        let data = null;
        if(categoryId) {
            data = await Test.find(
                {
                    $and: [
                        {
                            "name" : {$regex : `.*${searchWord ? searchWord : ''}.*`, $options: 'i' }
                        },
                        {
                            "difficulty": { $in: !_.isEmpty(difficulties) ? difficulties : [1, 2, 3, 4, 5] }
                        },
                        {
                            "category": categoryId
                        }
                    ]
                }
                
            ).limit(parseInt(pageSize)).skip(parseInt(page-1) * parseInt(pageSize)).populate([{ 
                path: 'questions',
                model: 'Question',
                populate: {
                  path: 'answers',
                  model: 'Answer'
                } 
               
             },  {
                path: 'category',
                model: 'Categories'
            }]);
        }
        else {
            data = await Test.find(
                {
                    $and: [
                        {
                            "name" : {$regex : `.*${searchWord ? searchWord : ''}.*`, $options: 'i' }
                        },
                        {
                            "difficulty": { $in: !_.isEmpty(difficulties) ? difficulties : [1, 2, 3, 4, 5] }
                        }
                    ]
                }
                
            ).limit(parseInt(pageSize)).skip(parseInt(page-1) * parseInt(pageSize)).populate([{ 
                path: 'questions',
                model: 'Question',
                populate: {
                  path: 'answers',
                  model: 'Answer'
                } 
               
             },  {
                path: 'category',
                model: 'Categories'
            }]);
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
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});


module.exports = router;