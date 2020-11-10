/**
 * The test cases for REST hook API.
 */
'use strict';

const expect = require('chai').expect;
let request = require('supertest');
const co = require('co');
const helper = require('../src/common/helper');
const app = require('../src/app');
const testConfig = require('./testConfig');
const RestHookService = require('../src/services/RestHookService');

request = request(app);

describe('REST Hook API Tests', () => {
  function* clearData() {
    const hooks = yield helper.findAll('RestHook', {});
    for (const hook of hooks) {
      yield hook.delete();
    }
  }

  before((done) => {
    co(clearData())
      .then(() => done())
      .catch(done);
  });

  after((done) => {
    co(clearData())
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
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        hookId = res.body.id;
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.owner).to.exist; // eslint-disable-line
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
      payload: { id: 123 }
    });
    done();
  });

  it('create hook - already defined', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(409, done);
  });

  it('create hook - unexpected field', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test',
        topic: 'topic',
        endpoint: 123,
        handle: 'test'
      })
      .expect(400, done);
  });

  it('create hook - not allowed topic', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        topic: 'topic2',
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(403, done);
  });

  it('create hook - missing name', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        description: 'desc',
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(400, done);
  });

  it('create hook - invalid topic', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        topic: { test: 'topic1' },
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(400, done);
  });

  it('create hook - invalid header value', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: ['value1'] },
        topic: 'test',
        endpoint: 'http://test.com/success',
        filter: '1+4 > 3'
      })
      .expect(400, done);
  });

  it('create hook - missing endpoint', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        topic: 'topic1',
        filter: '1+4 > 3'
      })
      .expect(400, done);
  });

  it('create hook - invalid filter', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: { invalid: 'abc' }
      })
      .expect(400, done);
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
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.owner).to.exist; // eslint-disable-line
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
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.owner).to.exist; // eslint-disable-line
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
      .send({
        name: 'test-name2',
        description: 'desc2',
        headers: { header2: 'value2' },
        topic: 'topic2',
        endpoint: 'http://test.com/success',
        filter: 'true'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.name).to.equal('test-name2');
        expect(res.body.description).to.equal('desc2');
        expect(res.body.headers.header2).to.equal('value2');
        expect(res.body.topic).to.equal('topic2');
        expect(res.body.endpoint).to.equal('http://test.com/success');
        expect(res.body.owner).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('true');
        expect(res.body.confirmed).to.equal(true);
        return done();
      });
  });

  it('update hook - not allowed', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .send({
        name: 'test',
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: 'true'
      })
      .expect(403, done);
  });

  it('update hook - missing endpoint', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test',
        topic: 'topic1',
        filter: 'true'
      })
      .expect(400, done);
  });

  it('update hook - name too long', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test123456789012345678901234567890123456789012345678901234567890',
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: 'true'
      })
      .expect(400, done);
  });

  it('update hook - invalid description', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test',
        description: [123],
        topic: 'topic1',
        endpoint: 'http://test.com/success',
        filter: 'true'
      })
      .expect(400, done);
  });

  it('get all hooks 2', (done) => {
    request.get('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .query({ limit: 10 })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.hooks.length).to.equal(1);
        expect(res.body.hooks[0].id).to.equal(hookId);
        expect(res.body.hooks[0].name).to.equal('test-name2');
        expect(res.body.hooks[0].description).to.equal('desc2');
        expect(res.body.hooks[0].headers.header2).to.equal('value2');
        expect(res.body.hooks[0].topic).to.equal('topic2');
        expect(res.body.hooks[0].endpoint).to.equal('http://test.com/success');
        expect(res.body.hooks[0].owner).to.exist; // eslint-disable-line
        expect(res.body.hooks[0].filter).to.equal('true');
        expect(res.body.hooks[0].confirmed).to.equal(true);
        return done();
      });
  });

  it('update hook - endpoint changed', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name3',
        description: 'desc3',
        headers: { header3: 'value3' },
        topic: 'topic1',
        endpoint: 'http://test.com/error',
        filter: 'true'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.equal(hookId);
        expect(res.body.name).to.equal('test-name3');
        expect(res.body.description).to.equal('desc3');
        expect(res.body.headers.header3).to.equal('value3');
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.owner).to.exist; // eslint-disable-line
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
        expect(res.body.name).to.equal('test-name3');
        expect(res.body.description).to.equal('desc3');
        expect(res.body.headers.header3).to.equal('value3');
        expect(res.body.topic).to.equal('topic1');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.owner).to.exist; // eslint-disable-line
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
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic3',
        endpoint: 'http://test.com/unconfirmed',
        filter: '1+4 > 3'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/unconfirmed');
        expect(res.body.owner).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback late', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic3',
        endpoint: 'http://test.com/late',
        filter: '1+4 > 3'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/late');
        expect(res.body.owner).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback not found', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic3',
        endpoint: 'http://test.com/not-found',
        filter: '1+4 > 3'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/not-found');
        expect(res.body.owner).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('create hook - callback error', (done) => {
    request.post('/api/v1/hooks')
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic3',
        endpoint: 'http://test.com/error',
        filter: '1+4 > 3'
      })
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.id).to.exist; // eslint-disable-line
        expect(res.body.name).to.equal('test-name');
        expect(res.body.description).to.equal('desc');
        expect(res.body.headers.header1).to.equal('value1');
        expect(res.body.topic).to.equal('topic3');
        expect(res.body.endpoint).to.equal('http://test.com/error');
        expect(res.body.owner).to.exist; // eslint-disable-line
        expect(res.body.filter).to.equal('1+4 > 3');
        expect(res.body.confirmed).to.equal(false);
        return done();
      });
  });

  it('update hook - already defined', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test-name',
        description: 'desc',
        headers: { header1: 'value1' },
        topic: 'topic3',
        endpoint: 'http://test.com/error',
        filter: 'true'
      })
      .expect(409, done);
  });

  it('get hook histories', (done) => {
    request.get(`/api/v1/hooks/${hookId}/histories`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(200)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        expect(res.body.length).to.equal(0);
        return done();
      });
  });

  it('get hook histories - forbidden', (done) => {
    request.get(`/api/v1/hooks/${hookId}/histories`)
      .set('Authorization', `Bearer ${testConfig.TEST_NON_ADMIN_TOKEN}`)
      .expect(403, done);
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

  it('get hook - not found', (done) => {
    request.get(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('update hook - not found', (done) => {
    request.put(`/api/v1/hooks/${hookId}`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .send({
        name: 'test',
        topic: 'topic2',
        endpoint: 'http://test.com/success'
      })
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

  it('get hook histories - not found', (done) => {
    request.get(`/api/v1/hooks/${hookId}/histories`)
      .set('Authorization', `Bearer ${testConfig.TEST_ADMIN_TOKEN}`)
      .expect(404, done);
  });

  it('get hook histories - missing token', (done) => {
    request.get(`/api/v1/hooks/${hookId}/histories`)
      .expect(401, done);
  });
});
