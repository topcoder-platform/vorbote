/**
 * The test cases for role topic API.
 */
'use strict';

const expect = require('chai').expect;
let request = require('supertest');
const app = require('../src/app');
const RoleTopic = require('../src/models').RoleTopic;
const testConfig = require('./testConfig');

request = request(app);

describe('Role Topic API Tests', () => {
  before((done) => {
    RoleTopic.remove({})
      .then(() => done())
      .catch(done);
  });

  after((done) => {
    RoleTopic.remove({})
      .then(() => done())
      .catch(done);
  });

  let theId;

  it('get all role topics 1', (done) => {
    request.get('/api/v1/roletopics')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.total).to.equal(0);
        return done();
      });
  });

  it('create role topic', (done) => {
    request.post('/api/v1/roletopics')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ role: 'test-role', topic: 'topic' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.role).to.equal('test-role');
        expect(res.body.topic).to.equal('topic');
        theId = res.body.id;
        return done();
      });
  });

  it('get all role topics 2', (done) => {
    request.get('/api/v1/roletopics')
      .query({ offset: 0, limit: 10 })
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.total).to.equal(1);
        expect(res.body.roleTopics[0].id).to.equal(theId);
        expect(res.body.roleTopics[0].role).to.equal('test-role');
        expect(res.body.roleTopics[0].topic).to.equal('topic');
        return done();
      });
  });

  it('delete role topic', (done) => {
    request.delete(`/api/v1/roletopics/${theId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200, done);
  });

  it('create role topic - invalid data', (done) => {
    request.post('/api/v1/roletopics')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic' })
      .expect(400, done);
  });

  it('get role topic - not found', (done) => {
    request.get(`/api/v1/roletopics/${theId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('delete role topic - not found', (done) => {
    request.delete(`/api/v1/roletopics/${theId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('get all role topics - missing token', (done) => {
    request.get('/api/v1/roletopics')
      .expect(401, done);
  });

  it('get all role topics - wrong token', (done) => {
    request.get('/api/v1/roletopics')
      .set('Authorization', 'Bearer wrong')
      .expect(401, done);
  });

  it('create role topic - not admin', (done) => {
    request.post('/api/v1/roletopics')
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .send({ role: 'test-role2', topic: 'topic2' })
      .expect(403, done);
  });
});
