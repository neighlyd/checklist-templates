require('./config/config');

const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const {bcrypt} = require('bcryptjs');

const {mongoose} = require('./db/mongoose');
const {Checklist} = require('./models/checklist');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

let app = express();

const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/checklists', authenticate, (req, res) => {
    let items = [];
    if (req.body.items) {
        req.body.items.forEach(item => {
            items.push(_.pick(item, ['text']));
        });
    }
    let checklist = new Checklist({
        title: req.body.title,
        _creator: req.user._id,
        items
    });
    checklist.save().then((doc) => {
        res.send(doc);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.get('/checklists', authenticate, (req, res) => {
   Checklist.find({
       _creator: req.user.id
   }).then((checklists) => {
       res.send({checklists});
    }, (e) => {
       res.status(400).send(e);
   });
});

app.get('/checklists/:id', authenticate, (req, res) => {
   let id = req.params.id;

   // verify that user sent a valid ObjectId.
   if (!ObjectID.isValid(id)){
       return res.sendStatus(400);
   }

   Checklist.findOne({
       _id: id,
       _creator: req.user.id
   }).then((checklist) => {

       // no checklist by that id found.
       if (!checklist){
           return res.sendStatus(404);
       }

       res.send({checklist});
   }).catch((e) => res.sendStatus(400));
});

app.delete('/checklists/:id', authenticate, (req, res) => {
    let id = req.params.id;

    // verify that user sent a valid ObjectId.
    if (!ObjectID.isValid(id)){
        return res.sendStatus(400);
    }

    Checklist.findOneAndDelete({
        _id: id,
        _creator: req.user.id
    }).then((checklist) => {
        if (!checklist){
            return res.sendStatus(404);
        }
        res.send({checklist});
    }).catch((e) => res.sendStatus(400));
});

app.patch('/checklists/:id', authenticate, (req, res) => {
   let id = req.params.id;
   let body = _.pick(req.body, ['title', 'completed']);

   body.items = [];

   if (req.body.items) {
       req.body.items.forEach( item => {
           body.items.push(_.pick(item, ['text', 'completed']));
       })
   }

   // verify that user sent a valid ObjectId.
    if (!ObjectID.isValid(id)){
        return res.sendStatus(400);
    }

    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Checklist.findOneAndUpdate({
        _id: id,
        _creator: req.user.id
    }, {
        $set: body
    }, {
        new: true
    }).then((checklist) => {
        if(!checklist) {
            return res.sendStatus(404);
        }
        res.send({checklist});
    }).catch((e) => res.sendStatus(400));
});

app.post('/users', (req, res) => {
    // use lodash.pick() so we only pass the information we want to the User model, not just any information the user sends us.
    let body = _.pick(req.body, ['email', 'password']);
    let user = new User({email: body.email, password: body.password});

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    }).catch((e) => {
        res.status(400).send(e);
    });
});

app.get('/users', (req, res) => {
   User.find().then((users) => {
       res.send(users);
   })
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    let body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then((user) => {
        return user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch((e) => {
        res.sendStatus(400);
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.sendStatus(200)
    }, () => {
        res.sendStatus(400);
    });
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