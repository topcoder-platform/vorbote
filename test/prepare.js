/*
 * Setting up mock callbacks for unit tests
 */

const nock = require('nock');
const prepare = require('mocha-prepare');

prepare((done) => {
  // called before loading of test cases
  nock('http://test.com')
    .persist()
    .post('/unconfirmed')
    .reply(() => [200, {}])
    .post('/late')
    .delay(12000)
    .reply(() => [200, {}])
    .post('/not-found')
    .reply(() => [404, {}])
    .post('/error')
    .reply(() => [500, {}])
    .matchHeader('x-hook-secret', val => val && val.length > 0)
    .post('/success')
    .reply(function () {
      const secret = this.req.headers['x-hook-secret'];
      return [200, { 'x-hook-secret': secret }];
    })
    .post('/success')
    .reply(() => [200, {}]);
  done();
}, (done) => {
  // called after all tests complete (regardless of errors)
  nock.cleanAll();
  done();
});
