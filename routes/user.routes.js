const multer = require('multer');
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const router = Router();
const uuidv4 = require('uuid');
const auth = require('../middlewares/auth');
const fs = require('fs')
const { promisify } = require('util');
const decodeUserId = require('../utils/decodeToken');
require('dotenv').config();
const { Types } = require('mongoose');
const unlinkAsync = promisify(fs.unlink)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/')
    },
    filename: (req, file, cb) => {
        const fileName = file.originalname.toLowerCase().split(' ').join('-');
        cb(null, uuidv4.v4() + '-' + fileName)
    }
});

var upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});

router.get('/', auth, async (req, res) => {
    await User.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.status(200).send(items);
        }
    });
});

router.get('/:id', auth, async (req, res) => {
try {
    await User.findById(req.params.id, (err, user) => {
        if(err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.status(200).send(user);
        }
    })
} catch (error) {
    console.log(error);
    res.status(500).json({
        message: "Something went wrong, try later"
    })
}
})
    
router.delete('/:id', auth, async (req, res) => {
    try {
        const usertoDelete = await User.findOne({_id: req.params.id});
        await User.findByIdAndDelete(req.params.id, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send('An error occurred', err);
            }
            else {
                const url = req.protocol + '://' + req.get('host') + '/uploads/';
                const photos = usertoDelete.photos;
                const photosToDelete = photos.map(el => {
                    return el.replace(url, 'uploads\\')
                })
                photosToDelete.forEach(el => {
                    unlinkAsync(el);
                })
                res.status(200).send(data);
            }
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Something went wrong, try later"
        })
    }
    
})

router.post(
    '/register',
    [
        upload.single('photo'),
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Minimum password length is 6').isLength({ min: 6 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                unlinkAsync(req.file.path);
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect registration data'
                })
            }
            const {email, password} = req.body;
            
            const url = req.protocol + '://' + req.get('host');
            const photoUrl = url + '/uploads/' + req.file.filename;
            const hashedPassword = await bcrypt.hash(password, 12);
            const id = Types.ObjectId();
            const obj = {
                _id: id,
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
                photo: photoUrl,
            }
            const candidate = await User.findOne({ email })

            if (candidate) {
                return res.status(400).json({ message: 'Email is already in use' })
            }

            const user = new User(obj)
            await user.save();
            res.status(201).json(req.body);
        } catch (e) {
            console.log(e);
            res.status(500).json({
                message: "Something went wrong, try later"
            })
        }


    });

router.post(
    '/login',
    [
        check('email', 'Enter correct email').normalizeEmail().isEmail(),
        check('password', 'Enter password').exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req.body);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                    message: 'Incorrect login data'
                })
            }

            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Wrong email ' })
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Wrong  password' })
            }
            const secret = process.env.JWT_SECRET
            const token = jwt.sign(
                { userId: user.id },
                secret,
                { expiresIn: '3600s' }
            );

            res.json({
                token, userId: user.id, expiresIn: '3600'
            })

        } catch (e) {
            console.log(e);
            res.status(500).json({
                message: "Что-то пошло не так, попробуйте позже"
            })
        }
    });

router.put('/update', auth, upload.single('photo'), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            unlinkAsync(req.file.path);
            return res.status(400).json({
                errors: errors.array(),
                message: 'Incorrect update data'
            })
        }
        const token = req.headers.authorization.split(' ')[1];
        const userId = decodeUserId(token);
        const user = await User.findById(userId);
        const password = req.body.password
         ? await bcrypt.hash(req.body.password, 12): user.password;
        let photo = user.photo;
        if(req.file) {
            const url = req.protocol + '://' + req.get('host') + '/uploads/';
            const photoToDelete = photo.replace(url, 'uploads\\');
            unlinkAsync(photoToDelete);
            photo = url + req.file.filename;
        }
        const updateData = {
            name: req.body.name,
            email: req.body.email,
            password: password,
            photo: photo,
        }
        await User.updateOne({
            _id: user.id
        }, updateData)
        res.status(201).json(updateData);
    } catch(e) {
        console.log(e);
        res.status(500).json({
            message: "Something went wrong, try later"
        })
    }
})

// router.get('/userid/:token', async (req, res) => {
//     try {
//         const secret = process.env.JWT_SECRET
//         let decoded = await jwt_decode(req.params.token, secret);
//         res.status(200).json(decoded.userId);
//     } catch (e) {
//         console.log(e);
//         res.status(500).json({
//             message: "Что-то пошло не так, попробуйте позже"
//         })
//     }
// })




module.exports = router;