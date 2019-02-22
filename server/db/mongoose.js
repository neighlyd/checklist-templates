const mongoose = require('mongoose');

mongoose.promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true});

module.exports = {mongoose};

// Heroku sets process.env.NODE_ENV === 'production'
// we can then set these to 'test' or 'development' to modify the MongoDB as desired.