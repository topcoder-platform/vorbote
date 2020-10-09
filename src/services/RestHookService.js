/**
 * Service for REST hooks.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const Joi = require('joi');
const axios = require('axios');
const uuid = require('uuid/v4');
const RestHook = require('../models').RestHook;
const RestHookHistory = require('../models').RestHookHistory;
const helper = require('../common/helper');
const logger = require('../common/logger');
const ConflictError = require('../common/errors').ConflictError;
const ForbiddenError = require('../common/errors').ForbiddenError;
const sandbox = require('sandbox.js');
const RoleTopicService = require('./RoleTopicService');

const hookSchema = Joi.object()
  .keys({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(400).allow(''),
    topic: Joi.string().required(),
    endpoint: Joi.string().required(),
    filter: Joi.string()
      .max(Number(config.RESTHOOK_FILTER_MAX_LENGTH))
      .allow(''),
    headers: Joi.object().pattern(/.*/, Joi.string().required()),
  })
  .required();

/**
 * Get all hooks.
 * @param {Object} query the query parameters
 * @returns {Object} hooks result
 */
function* getAllHooks(query) {
  const filter = {};
  if (query.owner) {
    filter.owner = query.owner;
  }
  const total = yield RestHook.count(filter);
  const hooks = yield RestHook.find(filter)
    .sort('_id')
    .skip(query.offset)
    .limit(query.limit);
  return { total, offset: query.offset, limit: query.limit, hooks };
}

getAllHooks.schema = {
  query: Joi.object().keys({
    owner: Joi.string(),
    offset: Joi.number()
      .integer()
      .min(0)
      .default(0),
    limit: Joi.number()
      .integer()
      .min(1)
      .default(10),
  }),
};

/**
 * Validate whether user can access the topic.
 * @param {Object} user the current user
 * @param {String} topic the Kafka topic
 */
function* validateUserTopic(user, topic) {
  if (user.isAdmin) {
    return;
  }
  const topics = yield RoleTopicService.getTopics(user.roles);
  if (_.indexOf(topics, topic) < 0) {
    throw new ForbiddenError(`You can not access topic: ${topic}.`);
  }
}

/**
 * Confirm endpoint.
 * @param {String} endpoint the endpoint to confirm
 * @returns {Boolean} whether it is confirmed
 */
function* confirmEndpoint(endpoint) {
  const secret = uuid();
  try {
    const res = yield axios.post(endpoint, '', {
      headers: { 'x-hook-secret': secret },
      timeout: Number(config.AXIOS_TIMEOUT),
    });

    if (_.isPlainObject(res.data)) {
      return res.data && res.data['x-hook-secret'] === secret;
    }

    return false;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

/**
 * Create hook.
 * @param {Object} data the request data
 * @param {Object} user the current user
 * @returns {Object} the created hook
 */
function* createHook(data, user) {
  // eslint-disable-next-line no-console
  console.log(data);
  // eslint-disable-next-line no-console
  console.log(user);
  yield validateUserTopic(user, data.topic);

  if (data.filter && data.filter.trim().length === 0) data.filter = null;

  const hook = yield RestHook.findOne({
    topic: data.topic,
    endpoint: data.endpoint,
  });
  if (hook) {
    throw new ConflictError('The hook is already defined.');
  }
  data.owner = user.handle;

  // confirm endpoint
  data.confirmed = yield confirmEndpoint(data.endpoint);

  // eslint-disable-next-line no-console
  console.log(data);
  return yield RestHook.create(data);
}

createHook.schema = {
  data: hookSchema,
  user: Joi.object().required(),
};

/**
 * Get hook.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Object} the hook
 */
function* getHook(id, user) {
  const hook = yield helper.ensureExists(RestHook, id);
  if (!user.isAdmin && hook.owner !== user.handle) {
    throw new ForbiddenError("You can not access other user's hook.");
  }
  return hook;
}

getHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required(),
};

/**
 * Update hook.
 * @param {String} id the hook id
 * @param {Object} data the request data
 * @param {Object} user the current user
 * @returns {Object} the updated hook
 */
function* updateHook(id, data, user) {
  yield validateUserTopic(user, data.topic);

  if (data.filter && data.filter.trim().length === 0) data.filter = null;

  const hk = yield RestHook.findOne({
    topic: data.topic,
    endpoint: data.endpoint,
  });
  if (hk && String(hk._id) !== id) {
    throw new ConflictError('The hook is already defined.');
  }

  const hook = yield getHook(id, user);

  // if endpoint is updated, then it needs to be re-confirmed
  if (data.endpoint !== hook.endpoint) {
    hook.confirmed = yield confirmEndpoint(data.endpoint);
  }

  _.assignIn(hook, data);
  if (!data.description) {
    hook.description = null;
  }
  if (!data.filter) {
    hook.filter = null;
  }
  if (!data.headers) {
    hook.headers = null;
  }
  return yield hook.save();
}

updateHook.schema = {
  id: Joi.string().required(),
  data: hookSchema,
  user: Joi.object().required(),
};

/**
 * Delete hook.
 * @param {String} id the hook id
 * @param {Object} user the current user
 */
function* deleteHook(id, user) {
  const hook = yield getHook(id, user);
  yield hook.remove();
}

deleteHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required(),
};

/**
 * Apply filter for a hook against given message.
 * @param {Object} hook the REST hook
 * @param {Object} message the message
 * @returns {Boolean} whether the hook should be called
 */
function filterHook(hook, message) {
  if (!hook.filter) {
    // there is no filter, then call the hook
    return true;
  }

  const filterFunc = () => eval(__FILTER_CODE); // eslint-disable-line
  const context = { __FILTER_CODE: hook.filter, message };
  try {
    return !!sandbox.runInSandbox(filterFunc, context);
  } catch (e) {
    logger.error('Failed to filter hook.');
    logger.error(e);
    // return false to ignore the hook
    return false;
  }
}

/**
 * Notify given hook of given message.
 * @param {Object} hook the hook
 * @param {Object} message the message
 */
function* notifyHook(hook, message) {
  const history = {
    hookId: hook._id,
    requestData: message,
  };
  // call hook endpoint
  try {
    const res = yield axios.post(hook.endpoint, message, {
      headers: hook.headers || {},
      timeout: Number(config.AXIOS_TIMEOUT),
      validateStatus: () => true,
    });
    history.responseStatus = res.status;
    if (res.status < 200 || res.status >= 300) {
      logger.error(`Failed to call hook endpoint: ${res.statusText}, ${JSON.stringify(res.data, null, 4)}`);
    }
  } catch (err) {
    logger.error('Failed to call hook endpoint.');
    logger.error(err);
    history.responseStatus = 500;
  }

  try {
    // remove old histories
    const histories = yield RestHookHistory.find({ hookId: hook._id }).sort('-createdAt');
    for (let i = Number(config.HOOK_HISTORY_COUNT) - 1; i < histories.length; i += 1) {
      yield histories[i].remove();
    }

    // save history
    yield RestHookHistory.create(history);
  } catch (e) {
    logger.error(e);
  }
}

/**
 * Notify hooks of given message.
 * @param {Object} message the message
 */
function* notifyHooks(message) {
  // find confirmed hooks of message topic
  const hooks = yield RestHook.find({ topic: message.topic, confirmed: true });
  // notify each hook in parallel
  yield _.map(hooks, hook => (filterHook(hook, message) ? notifyHook(hook, message) : null));
}

// notifyHooks.schema = {
//   message: Joi.object().keys({
//     topic: Joi.string().required(),
//     originator: Joi.string().required(),
//     timestamp: Joi.string().required(),
//     'mime-type': Joi.string().required(),
//     payload: Joi.any(),
//   }).required(),
// };

/**
 * Confirm hook.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Object} the updated hook
 */
function* confirmHook(id, user) {
  const hook = yield getHook(id, user);
  hook.confirmed = yield confirmEndpoint(hook.endpoint);
  return yield hook.save();
}

confirmHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required(),
};

/**
 * Get hook histories.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Array} the hook histories
 */
function* getHookHistories(id, user) {
  // ensure the hook exists and user can access it
  yield getHook(id, user);
  // find histories of given hook id
  // sort by createdAt in descending order, so that latest histories will be shown first
  const histories = yield RestHookHistory.find({ hookId: id }).sort('-createdAt');
  return histories;
}

getHookHistories.schema = {
  id: Joi.string().required(),
  user: Joi.object().required(),
};

// Exports
module.exports = {
  getAllHooks,
  createHook,
  getHook,
  updateHook,
  deleteHook,
  notifyHooks,
  confirmHook,
  getHookHistories,
};
