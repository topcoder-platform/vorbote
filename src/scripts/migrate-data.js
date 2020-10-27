/**
 * Migrate data from MongoDB to DynamoDB.
 */

require('../bootstrap');
const co = require('co');
const logger = require('../common/logger');
const helper = require('../common/helper');
const RestHook = require('../mongo-models').RestHook;
const RestHookHistory = require('../mongo-models').RestHookHistory;
const RoleTopic = require('../mongo-models').RoleTopic;

logger.info('Migrate data from MongoDB to DynamoDB.');

// convert MongoDB entity to data suitable for DynamoDB
function convertEntity(entity) {
  const obj = entity.toJSON();
  if (obj.createdAt) {
    obj.createdAt = obj.createdAt.toISOString();
  }
  if (obj.updatedAt) {
    obj.updatedAt = obj.updatedAt.toISOString();
  }
  if (obj.hookId) {
    obj.hookId = String(obj.hookId);
  }
  if (obj.requestData) {
    obj.requestData = JSON.stringify(obj.requestData);
  }
  if (obj.headers) {
    obj.headers = JSON.stringify(obj.headers);
  }
  return obj;
}

function* migrateData() {
  // migrate role types
  const rts = yield RoleTopic.find({});
  for (const rt of rts) {
    yield helper.create('RoleTopic', convertEntity(rt));
  }
  // migrate rest hooks
  const hooks = yield RestHook.find({});
  for (const hook of hooks) {
    yield helper.create('RestHook', convertEntity(hook));
  }
  // migrate rest hook histories
  const histories = yield RestHookHistory.find({});
  for (const h of histories) {
    yield helper.create('RestHookHistory', convertEntity(h));
  }
}

co(migrateData()).then(() => {
  logger.info('Done!');
  process.exit();
}).catch((e) => {
  logger.logFullError(e);
  process.exit(1);
});
