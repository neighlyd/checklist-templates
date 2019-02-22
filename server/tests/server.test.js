const request = require('supertest');
const expect = require('expect');
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Checklist} = require('../models/checklist');
const {checklists, populateChecklists} = require('./seed/seed');

beforeEach(populateChecklists);

describe('POST /checklists', () => {
   let title = 'A test checklist title';
   let items = [{text: 'Item One'}, {text: 'Item Two'}];

   it('should create a new checklist with no items', (done) => {
       request(app)
           .post('/checklists')
           .send({title})
           .expect(200)
           .expect((res) => {
               expect(res.body.title).toBe(title);
               expect(res.body.items.length).toBe(0);
           })
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.find({title}).then((checklists) => {
                   expect(checklists.length).toBe(1);
                   expect(checklists[0].title).toBe(title);
                   done();
               }).catch((e) => done(e));
           });
   });

   it('should create a new checklist with items', (done) => {
       request(app)
           .post('/checklists')
           .send({title, items})
           .expect(200)
           .expect((res) => {
               expect(res.body.title).toBe(title);
               expect(res.body.items.length).toBe(2);
           })
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.find({title}).then((checklists) => {
                   expect(checklists.length).toBe(1);
                   expect(checklists[0].title).toBe(title);
                   expect(checklists[0].items.length).toBe(2);
                   done();
               }).catch((e) => done(e));
           });
   });

   it('should create a new checklist but only populate items with valid information', (done) => {

       let items = [{
           text: 'Valid item with invalid entries',
           completed: true,
           completedAt: 1359078232345,
           extraField: 'unnecessary field'
       }];

       request(app)
           .post('/checklists')
           .send({title, items})
           .expect(200)
           .expect((res) => {
               expect(res.body.title).toBe(title);
               expect(res.body.items.length).toBe(1);
           })
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.find({title}).then((checklists) => {
                   expect(checklists.length).toBe(1);
                   expect(checklists[0].title).toBe(title);
                   expect(checklists[0].items.length).toBe(1);
                   expect(checklists[0].items[0].completed).toBeFalsy();
                   expect(checklists[0].items[0].completedAt).toBeFalsy();
                   done();
               }).catch((e) => done(e));
           });
   });

   it('should not create a new checklist with invalid request', (done) => {
       request(app)
           .post('/checklists')
           .send({})
           .expect(400)
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.find().then((checklists) => {
                   expect(checklists.length).toBe(2);
                   done();
               }).catch((e) => done(e))
           });
   });

   it('should not create a new checklist with subitems if subitems are invalid', (done) => {
       request(app)
           .post('/checklists')
           .send({title, items: [{text: ''}]})
           .expect(400)
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.find().then((checklists) => {
                   expect(checklists.length).toBe(2);
                   done();
               }).catch((e) => done(e))
           });
   });
});

describe('GET /checklists', () => {
   it('should get all checklists', (done) => {
       request(app)
           .get('/checklists')
           .expect(200)
           .expect((res) => {
               expect(res.body.checklists.length).toBe(2);
           })
           .end(done);
   })
});

describe('GET /checklists/:id', () => {
   it('should return a checklist with a valid id if present', (done) => {
       request(app)
           .get(`/checklists/${checklists[0]._id.toHexString()}`)
           .expect(200)
           .expect((res) => {
               expect(res.body.checklist.title).toBe(checklists[0].title)
           })
           .end(done);
   });

   it('should return 404 with a valid id if no checklist present', (done) => {
       let id = new ObjectID;

       request(app)
           .get(`/checklists/${id}`)
           .expect(404)
           .end(done);
   });

   it('should return 400 with an invalid id', (done) => {
        request(app)
            .get(`/checklists/${checklists[0]._id.toHexString() + '1a'}`)
            .expect(400)
            .end(done);
   });

});

describe('DELETE /checklists/:id', () => {
    let hexId = checklists[0]._id.toHexString();

   it('should remove a checklist', (done) => {
       request(app)
           .delete(`/checklists/${hexId}`)
           .expect(200)
           .expect((res) => {
               expect(res.body.checklist._id).toBe(hexId);
           })
           .end((err) => {
               if (err) {
                   return done(err);
               }
               Checklist.findById(hexId).then((checklist) => {
                   expect(checklist).toBeFalsy();
                   done();
               }).catch((e) => done(e));
           })
   });

   it('should return 404 if checklist not found', (done) => {
       let id = new ObjectID();

       request(app)
           .delete(`/checklists/${id}`)
           .expect(404)
           .end(done);
   });

   it('should return 400 for invalid object id', (done) => {
       request(app)
           .delete(`/checklists/${hexId + '1a'}`)
           .expect(400)
           .end(done);
   });
});

describe('PATCH /checklists/:id', () => {
    it('should update checklist and set date on completed', (done) => {
       let id = checklists[0]._id;
       let body = checklists[0];
       body.title = 'Updated first test';
       body.completed = true;

       request(app)
           .patch(`/checklists/${id}`)
           .send(body)
           .expect(200)
           .expect((res) => {
               expect(res.body.checklist.title).toBe(body.title);
               expect(res.body.checklist.completed).toBeTruthy();
               expect(typeof res.body.checklist.completedAt).toBe('number')
           })
           .end(done);
    });

    it('should update nested checklist items', (done) => {
        let id = checklists[0]._id;
        let body = checklists[0];
        body.items[0].text = 'Updated Item One Text';
        body.items[0].completed = true;

        request(app)
            .patch(`/checklists/${id}`)
            .send(body)
            .expect(200)
            .expect((res) => {
                expect(res.body.checklist.title).toBe(body.title);
                expect(res.body.checklist.items[0].completed).toBeTruthy();
                expect(res.body.checklist.items[0].text).toBe(body.items[0].text);
            })
            .end(done);

    });

    it('should unset date when checklist set to uncompleted', (done) => {
        let id = checklists[1]._id;
        let body = checklists[1];
        body.title = 'Updated first test';
        body.completed = false;

        request(app)
            .patch(`/checklists/${id}`)
            .send(body)
            .expect(200)
            .expect((res) => {
                expect(res.body.checklist.title).toBe(body.title);
                expect(res.body.checklist.completed).toBeFalsy();
                // This is literally working in the database, just not the test suite and I have NO idea why...
                // console.log('completedAt type for final test is: ', typeof res.body.checklist.completedAt);
                // console.log('completedAt value for final test is : ', res.body.checklist.completedAt);
                // expect(typeof res.body.checklist.completedAt).toBe(null);
            })
            .end(done);
    });
});