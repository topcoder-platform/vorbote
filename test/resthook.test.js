/**
 * The test cases for REST hook API.
 */
'use strict';

const expect = require('chai').expect;
let request = require('supertest');
const app = require('../src/app');
const RestHook = require('../src/models').RestHook;
const testConfig = require('./testConfig');
const RestHookService = require('../src/services/RestHookService');

request = request(app);

describe('REST Hook API Tests', () => {
  before((done) => {
    RestHook.remove({})
      .then(() => done())
      .catch(done);
  });

  after((done) => {
    RestHook.remove({})
      .then(() => done())
      .catch(done);
  });

  let hookId;

  it('get all hooks 1', (done) => {
    request.get('/api/v1/hooks')
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

  it('create hook - success', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic1', endpoint: 'http://test.com/success', filter: '1+4 > 3' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        hookId = res.body.id;
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(true);
        return done();
      });
  });

  it('notify hooks', (done) => {
    RestHookService.notifyHooks({
      topic: 'topic1',
      originator: 'originator',
      timestamp: new Date(),
      'mime-type': 'application/json',
      payload: { id: 123 },
    });
    done();
  });

  it('create hook - already defined', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic1', endpoint: 'http://test.com/success', filter: '1+4 > 3' })
      .expect(409, done);
  });

  it('create hook - not allowed topic', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .send({ topic: 'topic2', endpoint: 'http://test.com/success', filter: '1+4 > 3' })
      .expect(403, done);
  });

  it('get hook', (done) => {
    request.get(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(true);
        return done();
      });
  });

  it('confirm hook - success', (done) => {
    request.post(`/api/v1/hooks/${hookId}/confirm`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(true);
        return done();
      });
  });

  it('get hook - not allowed', (done) => {
    request.get(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .expect(403, done);
  });

  it('update hook - endpoint not changed', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic2', endpoint: 'http://test.com/success', filter: 'true' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.topic).to.equal('topic2');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('true');
        expect(res.body.confirmed).to.equal(true);
        return done();
      });
  });

  it('update hook - not allowed', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .send({ topic: 'topic1', endpoint: 'http://test.com/success', filter: 'true' })
      .expect(403, done);
  });

  it('update hook - invalid data', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic2' })
      .expect(400, done);
  });

  it('get all hooks 2', (done) => {
    request.get('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .query({ offset: 0, limit: 10 })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.total).to.equal(1);
        expect(res.body.hooks[0].id).to.equal(hookId);
        expect(res.body.hooks[0].topic).to.equal('topic2');
        expect(res.body.hooks[0].endpoint).to.equal('http://test.com/success');
        expect(res.body.hooks[0].handle).to.exist; // eslint-disable-line
        expect(res.body.hooks[0].filter).to.equal('true');
        expect(res.body.hooks[0].confirmed).to.equal(true);
        return done();
      });
  });

  it('update hook - endpoint changed', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic1', endpoint: 'http://test.com/error', filter: 'true' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('true');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('confirm hook - failed', (done) => {
    request.post(`/api/v1/hooks/${hookId}/confirm`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('true');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('confirm hook - not allowed', (done) => {
    request.post(`/api/v1/hooks/${hookId}/confirm`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .expect(403, done);
  });

  it('create hook - callback unconfirmed', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic3', endpoint: 'http://test.com/unconfirmed', filter: '1+4 > 3' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/unconfirmed');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback late', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic3', endpoint: 'http://test.com/late', filter: '1+4 > 3' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/late');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback not found', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic3', endpoint: 'http://test.com/not-found', filter: '1+4 > 3' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/not-found');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback error', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic3', endpoint: 'http://test.com/error', filter: '1+4 > 3' })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.handle).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('update hook - already defined', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic3', endpoint: 'http://test.com/error', filter: 'true' })
      .expect(409, done);
  });

  it('delete hook - not allowed', (done) => {
    request.delete(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .expect(403, done);
  });

  it('delete hook', (done) => {
    request.delete(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200, done);
  });

  it('create hook - invalid data', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic', endpoint: 123, handle: 'test' })
      .expect(400, done);
  });

  it('get hook - not found', (done) => {
    request.get(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('update hook - not found', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({ topic: 'topic2', endpoint: 'http://test.com/success' })
      .expect(404, done);
  });

  it('delete hook - not found', (done) => {
    request.delete(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('get all hooks - missing token', (done) => {
    request.get('/api/v1/hooks')
      .expect(401, done);
  });

  it('get all hooks - wrong token', (done) => {
    request.get('/api/v1/hooks')
      .set('Authorization', 'Bearer wrong')
      .expect(401, done);
  });
});
