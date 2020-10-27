/**
 * Put test data to MongoDB. It will clear existing data.
 */

require('../bootstrap');
const co = require('co');
const logger = require('../common/logger');
const RestHook = require('../mongo-models').RestHook;
const RestHookHistory = require('../mongo-models').RestHookHistory;
const RoleTopic = require('../mongo-models').RoleTopic;

logger.info('Put test data to MongoDB.');

function* testData() {
  yield RestHookHistory.deleteMany({});
  yield RestHook.deleteMany({});
  yield RoleTopic.deleteMany({});

  yield RoleTopic.create({ role: 'role1', topic: 'topic1' });
  yield RoleTopic.create({ role: 'role2', topic: 'topic2' });

  const hook = yield RestHook.create({
    name: 'test-hook',
    description: 'desc',
    topic: 'topic1',
    endpoint: 'http://test.com',
    owner: 'tester',
    filter: '1 + 3 > 2',
    confirmed: true,
    headers: { header1: 'value1', header2: 'value2' }
  });
  yield RestHook.create({
    name: 'test-hook2',
    description: 'desc2',
    topic: 'topic2',
    endpoint: 'http://test.com',
    owner: 'tester',
    filter: '1 + 3 > 2',
    confirmed: false,
    headers: { header1: 'value3', header2: 'value4' }
  });

  yield RestHookHistory.create({
    hookId: hook._id,
    requestData: { a: 1, b: 2, c: 'test1' },
    responseStatus: 200
  });
  yield RestHookHistory.create({
    hookId: hook._id,
    requestData: { a: 3, b: 3, c: 'test2' },
    responseStatus: 400
  });
}

co(testData()).then(() => {
  logger.info('Done!');
  process.exit();
}).catch((e) => {
  logger.logFullError(e);
  process.exit(1);
});
