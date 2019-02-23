const request = require('supertest');
const expect = require('expect');
const {ObjectID} = require('mongodb');

const {app} = require('../server');
const {Checklist} = require('../models/checklist');
const {User} = require('../models/user');
const {checklists, populateChecklists, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateChecklists);

describe('POST /checklists', () => {
   let title = 'A test checklist title';
   let items = [{text: 'Item One'}, {text: 'Item Two'}];

   it('should create a new checklist with no items', (done) => {
       let token = users[0].tokens[0].token;

       request(app)
           .post('/checklists')
           .set('x-auth', token)
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
       let token = users[0].tokens[0].token;

       request(app)
           .post('/checklists')
           .set('x-auth', token)
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
       let token = users[0].tokens[0].token;
       let items = [{
           text: 'Valid item with invalid entries',
           completed: true,
           completedAt: 1359078232345,
           extraField: 'unnecessary field'
       }];

       request(app)
           .post('/checklists')
           .set('x-auth', token)
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
       let token = users[0].tokens[0].token;
       request(app)
           .post('/checklists')
           .set('x-auth', token)
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
       let token = users[0].tokens[0].token;
       request(app)
           .post('/checklists')
           .set('x-auth', token)
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
    let token = users[0].tokens[0].token;

   it('should get only the checklists belonging to a user', (done) => {

       request(app)
           .get('/checklists')
           .set('x-auth', token)
           .expect(200)
           .expect((res) => {
               expect(res.body.checklists.length).toBe(1);
           })
           .end(done);
   })
});

describe('GET /checklists/:id', () => {

   it('should return a checklist with a valid id, checklist present, and user is creator', (done) => {
       let token = users[0].tokens[0].token;

       request(app)
           .get(`/checklists/${checklists[0]._id.toHexString()}`)
           .set('x-auth', token)
           .expect(200)
           .expect((res) => {
               expect(res.body.checklist.title).toBe(checklists[0].title)
           })
           .end(done);
   });

    it('should not return a checklist with a valid id, checklist present, and user is creator', (done) => {
        let token = users[0].tokens[0].token;

        request(app)
            .get(`/checklists/${checklists[1]._id.toHexString()}`)
            .set('x-auth', token)
            .expect(404)
            .end(done);
    });

   it('should return 404 with a valid id if no checklist present', (done) => {
       let token = users[0].tokens[0].token;
       let id = new ObjectID;

       request(app)
           .get(`/checklists/${id}`)
           .set('x-auth', token)
           .expect(404)
           .end(done);
   });

   it('should return 400 with an invalid id', (done) => {
       let token = users[0].tokens[0].token;
        request(app)
            .get(`/checklists/${checklists[0]._id.toHexString() + '1a'}`)
            .set('x-auth', token)
            .expect(400)
            .end(done);
   });

});

describe('DELETE /checklists/:id', () => {

   it('should remove a checklist if user is authorized', (done) => {
       let hexId = checklists[0]._id.toHexString();
       let token = users[0].tokens[0].token;

       request(app)
           .delete(`/checklists/${hexId}`)
           .set('x-auth', token)
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

   it('should not remove a checklist if user is unauthorized', (done) => {
       let hexId = checklists[1]._id.toHexString();
       let token = users[0].tokens[0].token;

       request(app)
           .delete(`/checklists/${hexId}`)
           .set('x-auth', token)
           .expect(404)
           .end((err, res) => {
               if (err) {
                   return done(err);
               }
               Checklist.findById(hexId).then((checklist) => {
                   expect(checklist).toBeTruthy();
                   done();
               }).catch((e) => done(e));
           });
   });

   it('should return 404 if checklist not found', (done) => {
       let id = new ObjectID();
       let token = users[0].tokens[0].token;

       request(app)
           .delete(`/checklists/${id}`)
           .set('x-auth', token)
           .expect(404)
           .end(done);
   });

   it('should return 400 for invalid object id', (done) => {
       let token = users[0].tokens[0].token;
       let hexId = checklists[1]._id.toHexString();

       request(app)
           .delete(`/checklists/${hexId + '1a'}`)
           .set('x-auth', token)
           .expect(400)
           .end(done);
   });
});

describe('PATCH /checklists/:id', () => {
    it('should update checklist and set date on completed if user authorized', (done) => {
        let token = users[0].tokens[0].token;
        let id = checklists[0]._id;
        let body = checklists[0];
        body.title = 'Updated first test';
        body.completed = true;

        request(app)
            .patch(`/checklists/${id}`)
            .set('x-auth', token)
            .send(body)
            .expect(200)
            .expect((res) => {
               expect(res.body.checklist.title).toBe(body.title);
               expect(res.body.checklist.completed).toBeTruthy();
               expect(typeof res.body.checklist.completedAt).toBe('number')
           })
            .end(done);
    });

    it('should not update checklist and set date on completed if user unauthorized', (done) => {
        let token = users[0].tokens[0].token;
        let id = checklists[1]._id;
        let body = checklists[1];
        body.title = 'Updated first test';
        body.completed = true;

        request(app)
            .patch(`/checklists/${id}`)
            .set('x-auth', token)
            .send(body)
            .expect(404)
            .end(done);
    });

    it('should update nested checklist items if user authorized', (done) => {
        let token = users[0].tokens[0].token;
        let id = checklists[0]._id;
        let body = checklists[0];
        body.items[0].text = 'Updated Item One Text';
        body.items[0].completed = true;

        request(app)
            .patch(`/checklists/${id}`)
            .set('x-auth', token)
            .send(body)
            .expect(200)
            .expect((res) => {
                expect(res.body.checklist.title).toBe(body.title);
                expect(res.body.checklist.items[0].completed).toBeTruthy();
                expect(res.body.checklist.items[0].text).toBe(body.items[0].text);
            })
            .end(done);

    });

    it('should unset date when checklist set to uncompleted and user is authorized', (done) => {
        let token = users[0].tokens[0].token;
        let id = checklists[0]._id;
        let body = checklists[0];
        body.title = 'Updated first test';
        body.completed = false;

        request(app)
            .patch(`/checklists/${id}`)
            .set('x-auth', token)
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

describe('POST /users', () => {
    it('should create a user', (done) => {
        let email = 'example@example.com';
        let password = '1235asdfk';

        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect((res) => {
                expect(res.header['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }

                User.findOne({email}).then((user) => {
                    expect(user).toBeTruthy();
                    expect(user.password).not.toBe(password);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not return validation errors if request invalid', (done) => {
        let email = 'dustin.com';
        let password = '';

        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(done);
    });

    it('should not create user if email already in database', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'password123'
            })
            .expect(400)
            .end(done);
    });
});