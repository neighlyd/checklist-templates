require('./config/config');

const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const {bcrypt} = require('bcryptjs');

const {mongoose} = require('./db/mongoose');
const {Checklist} = require('./models/checklist');

let app = express();

const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/checklists', (req, res) => {
    let items = [];
    if (req.body.items) {
        items = req.body.items;
    }

    let checklist = new Checklist({
        title: req.body.title,
        items: req.body.items
    });
    checklist.save().then((doc) => {
        res.send(doc);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.get('/checklists', (req, res) => {
   Checklist.find().then((checklists) => {
       res.send({checklists});
    }, (e) => {
       res.status(400).send(e);
   });
});

app.get('/checklists/:id', (req, res) => {
   let id = req.params.id;

   // verify that user sent a valid ObjectId.
   if (!ObjectID.isValid(id)){
       return res.sendStatus(400);
   }

   Checklist.findOne({_id: id}).then((checklist) => {

       // no checklist by that id found.
       if (!checklist){
           return res.sendStatus(404);
       }

       res.send({checklist});
   }).catch((e) => res.sendStatus(400));
});

app.delete('/checklists/:id', (req, res) => {
    let id = req.params.id;

    // verify that user sent a valid ObjectId.
    if (!ObjectID.isValid(id)){
        return res.sendStatus(400);
    }

    Checklist.findOneAndDelete({_id: id}).then((checklist) => {
        if (!checklist){
            return res.sendStatus(404);
        }
        res.send({checklist});
    }).catch((e) => res.sendStatus(400));
});

app.listen(port, () => {
    let now = new Date().toString();
    let log = `${now}: Server started on port ${port}`;
    fs.appendFile('server.log', log + '\n', (err) => {
        if (err) {
            console.log('Unable to append to server.log.');
        } else {
            console.log(log);
        }
    });
});

module.exports = {app};