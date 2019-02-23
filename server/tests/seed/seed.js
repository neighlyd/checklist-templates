const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Checklist} = require('../../models/checklist');
const {User} = require('../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
    _id: userOneId,
    email: 'dustin@example.com',
    password: 'hunter21',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}, {_id: userTwoId,
    email: 'natasha@example.com',
    password: 'notASecurePassword',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}];


const checklists = [{
    _id: new ObjectID(),
    title: 'Test checklist one',
    _creator: userOneId,
    items: [
        {
            text: 'Item One'
        }
    ]
}, {
    _id: new ObjectID(),
    title: 'Test checklist two',
    _creator: userTwoId,
    completed: true,
    completedAt: 230978,
    items: [
        {
            text: 'Item One'
        },
        {
            text: 'Item Two',
            completed: true
        }
    ]
}];

const populateChecklists = (done) => {
    // clear the Checklist collection and populate with seed data before running each test.
    Checklist.deleteMany({}).then(() => {
        return Checklist.insertMany(checklists);
    }).then(() => done());
};

const populateUsers = (done) => {
    User.deleteMany({}).then(() => {
        let userOne = new User(users[0]).save();
        let userTwo = new User(users[1]).save();

        // Promise.all([n]) waits until ALL n promises have been resolved to trigger callbacks at end of parent promise chain.
        Promise.all([userOne, userTwo])
    }).then(() => done());
};

module.exports = {checklists, populateChecklists, users, populateUsers};