const {ObjectID} = require('mongodb');

const {Checklist} = require('../../models/checklist');

const checklistOneId = new ObjectID();
const checklistTwoId = new ObjectID();

const checklists = [{
    _id: checklistOneId,
    title: 'Test checklist one',
    items: [
        {
            text: 'Item One'
        }
    ]
}, {
    _id: checklistTwoId,
    title: 'Test checklist two',
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

module.exports = {checklists, populateChecklists};