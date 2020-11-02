/**
 * Migrate data from MongoDB to DynamoDB.
 */

require('../bootstrap');
const co = require('co');
const logger = require('../common/logger');
const helper = require('../common/helper');
const RestHook = require('../mongo-models').RestHook;
const RoleTopic = require('../mongo-models').RoleTopic;

logger.info('Migrate data from MongoDB to DynamoDB.');

// convert MongoDB entity to data suitable for DynamoDB
function convertEntity(entity) {
  const obj = entity.toJSON();
  logger.info('Object: ', obj)
  if (obj.createdAt) {
    obj.createdAt = obj.createdAt.toISOString();
  }
  if (obj.updatedAt) {
    obj.updatedAt = obj.updatedAt.toISOString();
  }
  obj.confirmed = true
  obj.name = obj.handle
  obj.owner = obj.handle
  delete obj.handle
  return obj;
}

function* migrateData() {
  // migrate role types
  logger.info('Migrating Role topics...')
  const rts = yield RoleTopic.find({});
  for (const rt of rts) {
    yield helper.create('RoleTopic', convertEntity(rt));
  }
  // migrate rest hooks
  logger.info('Migrating Rest hooks...')
  const hooks = yield RestHook.find({});
  for (const hook of hooks) {
    yield helper.create('RestHook', convertEntity(hook));
  }
}

co(migrateData()).then(() => {
  logger.info('Done!');
  process.exit();
}).catch((e) => {
  logger.logFullError(e);
  process.exit(1);
});
