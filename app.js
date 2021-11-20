const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const auth = require('./middlewares/auth');
require('dotenv').config();

// auth router attaches /login, /logout, and /callback routes to the baseURL
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.json());
app.use(require('./routes/image.routes'));
app.use('/uploads', express.static('uploads'))
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/category', require('./routes/categories.routes'));
app.use('/api/test', require('./routes/test.routes'));
app.use('/api/testResult', auth, require('./routes/testResults.routes'));
const PORT = process.env.PORT || 8080;
const MongoURI = process.env.MONGO_URI;

async function start() {
    try {
        mongoose.Promise = global.Promise;
        await mongoose.connect(MongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        app.listen(PORT, () => {
            console.log(`App has been started on PORT: ${PORT}`);
        });

    } catch (e) {
        console.log('Server error', e.message);
        process.exit(1);
    }
}

start();

