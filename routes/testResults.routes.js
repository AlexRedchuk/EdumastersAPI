const { Router } = require('express');
const router = Router();
const TestResults = require('../models/TestResults');
const decodeUserId = require('../utils/decodeToken');
const User = require('../models/User');

router.post(
    '/add',
    async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const userId = decodeUserId(token);
        const currentUser = await User.findOne({_id: userId});
        await TestResults.create({
            mark: req.body.mark,
            user: currentUser._id,
            test: req.body.testId
        }, (error, data)=> {
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
    const result = await TestResults.aggregate([ {
        $group: {
            _id: userId,
            exp: {
                $sum: "$mark"
            }
        }  
    }
        
    ])
    res.status(201).json(result);
})

router.get('/searchByName', async (req, res) => {

})


module.exports = router;