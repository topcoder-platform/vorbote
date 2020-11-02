/**
 * Initialize database tables. All data will be cleared.
 */

require('../bootstrap');
const co = require('co');
const logger = require('../common/logger');
const helper = require('../common/helper');

logger.info('Initialize database.')

function* initDB() {
  // clear all histories
  const histories = yield helper.findAll('RestHookHistory', {});
  for (const h of histories) {
    yield h.delete();
  }
  // clear all hooks
  const hooks = yield helper.findAll('RestHook', {});
  for (const hook of hooks) {
    yield hook.delete();
  }
  // clear all role topics
  const rts = yield helper.findAll('RoleTopic', {});
  for (const rt of rts) {
    yield rt.delete();
  }
}

co(initDB()).then(() => {
  logger.info('Done!');
  process.exit();
}).catch((e) => {
  logger.logFullError(e);
  process.exit(1);
});
