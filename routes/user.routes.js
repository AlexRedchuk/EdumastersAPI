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
const unlinkAsync = promisify(fs.unlink);
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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
    
// router.delete('/:id', auth, async (req, res) => {
//     try {
//         const usertoDelete = await User.findOne({_id: req.params.id});
//         await User.findByIdAndDelete(req.params.id, (err, data) => {
//             if (err) {
//                 console.log(err);
//                 res.status(500).send('An error occurred', err);
//             }
//             else {
//                 const url = req.protocol + '://' + req.get('host') + '/uploads/';
//                 const photos = usertoDelete.photos;
//                 const photosToDelete = photos.map(el => {
//                     return el.replace(url, 'uploads\\')
//                 })
//                 photosToDelete.forEach(el => {
//                     unlinkAsync(el);
//                 })
//                 res.status(200).send(data);
//             }
//         })
        
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({
//             message: "Something went wrong, try later"
//         })
//     }
    
// })

router.get('/confirmEmail/:token', async (req, res) => {
    try {
        const userId = decodeUserId(req.params.token, process.env.JWT_EMAIL_SECRET);
        await User.updateOne({ _id: userId}, { isConfirmed: true });
        return res.redirect(`${process.env.FRONT_URL}/login`);
    } catch(e) {
        console.log(error);
        res.status(500).json({
            message: "Something went wrong, try later"
        })
    }
    
})

router.post('/resetPassword', async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});
        const secret = process.env.JWT_RESET_SECRET;
        const token = jwt.sign(
            { userId: user.id },
            secret,
            { expiresIn: '3600s' }
        );
        if(!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }
        const msg = {
            to: user.email,
            from: 'edumasters.team@gmail.com', // Use the email address or domain you verified above
            subject: 'Password reset',
            text: 'Password reset',
            html: `<h3> <a href="${process.env.FRONT_URL}/resetPassword/${token}">Password reset link</a></h3>`,
        };

        sgMail
            .send(msg)
            .then(() => {}, error => {
                console.error(error);

                if (error.response) {
                    console.error(error.response.body)
                }
                return res.status(500).json({
                    message: "Email sending error"
                });
            });
        res.status(200).json({
            message: "Email has been sent"
        })
    } catch (e) {
        console.log(e);
        res.status(500).json({
            message: "Something went wrong, try later"
        })
    }
})


router.put('/newPassword', async (req, res) => {
    try {
        const { password, resetToken } = req.body;
        const userId = decodeUserId(resetToken, process.env.JWT_RESET_SECRET);
        const newPassword = await bcrypt.hash(password, 12);
        await User.updateOne({
            _id: userId
        }, {
            password: newPassword
        })
        res.status(201).json({
            message: "Password successfully updated"
        })
    } catch(e) {
        console.log(error);
        res.status(500).json({
            message: "Something went wrong, try later"
        })
    }
})

router.post(
    '/register',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Minimum password length is 6').isLength({ min: 6 })
    ],
    async (req, res) => {
        try {
        
            const {email, password} = req.body;
            
            const hashedPassword = await bcrypt.hash(password, 12);
            const id = Types.ObjectId();
            const obj = {
                _id: id,
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            }
            const candidate = await User.findOne({ email })

            if (candidate) {
                return res.status(400).json({ message: 'Email is already in use' })
            }

            const secret = process.env.JWT_EMAIL_SECRET
            const token = jwt.sign(
                { userId: id },
                secret,
                { expiresIn: '3600s' }
            );
            
            const user = new User(obj);
            const msg = {
                to: obj.email,
                from: 'edumasters.team@gmail.com', // Use the email address or domain you verified above
                subject: 'Email confirmation',
                text: 'Thank you for registration!',
                html: `<h3>Please <a href="${process.env.BASE_URL}/api/user/confirmEmail/${token}">verify your email </a></h3>`,
            };

            sgMail
                .send(msg)
                .then(() => {}, error => {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                    return res.status(500).json({
                        message: "Email sending error"
                    });
                });
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
                return res.status(400).json({ message: 'Wrong credentials e' })
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Wrong credentials p' })
            }
            if(!user.isConfirmed) {
                return res.status(400).json({ message: 'Confirm your email' })
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
                message: "Something went wrong, try later"
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
        const userId = decodeUserId(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
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
            nickname: req.body.nickname,
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





module.exports = router;