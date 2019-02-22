require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const {bcrypt} = require('bcryptjs');

const {mongoose} = require('./db/mongoose');

let app = express();

const port = process.env.PORT;

app.use(bodyParser.json());

app.listen(port, () => {
    console.log(`Started on port ${port}`)
});