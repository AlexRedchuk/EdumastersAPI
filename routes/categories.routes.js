const { Router } = require('express');
const router = Router();
const auth = require('../middlewares/auth');
const Categories = require('../models/Categories');

// api/categories/add
router.post(
    '/add',
    async (req, res, next) => {
    try {
        await Categories.create(req.body, (error, data)=> {
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


// api/categories/get
router.get('/get', async (req, res) => {
    try {
        Categories.find((error, data) => {
            if(error) {
                return next(error);
            }
            else  {
                res.json(data);
            }
        })
    } catch (e) {
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});

// api/categories/get/:id
router.get('/get/:id', async (req, res, next) => {
    try {
        Categories.findById(req.params.id, (error, data) => {
            if (error) {
                return next(error);
            } else {
                res.json(data);
            }
        })
    } catch (e) {
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});

// api/categories/update/:id

router.put('/update/:id', async (req, res, next) => {
   try {
       Categories.findByIdAndUpdate(req.params.id, req.body, (error, data) => {
           if (error) {
               console.log(error);
               return next(error);
           } else {
               res.json(data);
           }
       })
   } catch (e) {
       console.log(e);
       res.status(500).json({
           message: "Что-то пошло не так, попробуйте позже"
       })
   }
});

// api/categories/delete/:id

router.delete('/delete/:id', async (req, res, next) => {
    try {
        Categories.findByIdAndDelete(req.params.id, (error, data) => {
            if (error) {
                console.log(error);
                return next(error);
            } else {
                res.status(200).json({ message: "Страна удалена"});
            }
        })
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Что-то пошло не так, попробуйте позже"
        })
    }
});

module.exports = router;