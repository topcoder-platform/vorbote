/**
 * Service for REST hooks.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const Joi = require('joi');
const axios = require('axios');
const RestHook = require('../models').RestHook;
const helper = require('../common/helper');
const logger = require('../common/logger');
const ConflictError = require('../common/errors').ConflictError;
const ForbiddenError = require('../common/errors').ForbiddenError;
const sandbox = require('sandbox.js');
const RoleTopicService = require('./RoleTopicService');

const hookSchema = Joi.object().keys({
  topic: Joi.string().required(),
  endpoint: Joi.string().required(),
  filter: Joi.string().max(Number(config.RESTHOOK_FILTER_MAX_LENGTH)).allow(''),
}).required();

/**
 * Get all hooks.
 * @param {Object} query the query parameters
 * @returns {Object} hooks result
 */
function* getAllHooks(query) {
  const filter = {};
  if (query.handle) {
    filter.handle = query.handle;
  }
  const total = yield RestHook.count(filter);
  const hooks = yield RestHook.find(filter).sort('_id').skip(query.offset).limit(query.limit);
  return { total, offset: query.offset, limit: query.limit, hooks };
}

getAllHooks.schema = {
  query: Joi.object().keys({
    handle: Joi.string(),
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).default(10),
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
 * Create hook.
 * @param {Object} data the request data
 * @param {Object} user the current user
 * @returns {Object} the created hook
 */
function* createHook(data, user) {
  yield validateUserTopic(user, data.topic);

  if (data.filter && data.filter.trim().length === 0) data.filter = null;

  const hook = yield RestHook.findOne({ topic: data.topic, endpoint: data.endpoint });
  if (hook) {
    throw new ConflictError('The hook is already defined.');
  }
  data.handle = user.handle;
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
  if (!user.isAdmin && hook.handle !== user.handle) {
    throw new ForbiddenError('You can not access other user\'s hook.');
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

  const hk = yield RestHook.findOne({ topic: data.topic, endpoint: data.endpoint });
  if (hk && String(hk._id) !== id) {
    throw new ConflictError('The hook is already defined.');
  }

  const hook = yield helper.ensureExists(RestHook, id);
  if (!user.isAdmin && hook.handle !== user.handle) {
    throw new ForbiddenError('You can not access other user\'s hook.');
  }
  data.handle = user.handle;
  _.assignIn(hook, data);
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
  const hook = yield helper.ensureExists(RestHook, id);
  if (!user.isAdmin && hook.handle !== user.handle) {
    throw new ForbiddenError('You can not access other user\'s hook.');
  }
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
 * Notify hooks of given message.
 * @param {Object} message the message
 */
function* notifyHooks(message) {
  // find hooks of message topic
  const hooks = yield RestHook.find({ topic: message.topic });
  // notify each hook in parallel
  yield _.map(hooks, (hook) => (filterHook(hook, message) ?
    axios.post(hook.endpoint, message).catch((err) => logger.error(err)) : null));
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

// Exports
module.exports = {
  getAllHooks,
  createHook,
  getHook,
  updateHook,
  deleteHook,
  notifyHooks,
};
