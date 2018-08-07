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
const sandbox = require('sandbox.js');

const hookSchema = Joi.object().keys({
  topic: Joi.string().required(),
  endpoint: Joi.string().required(),
  handle: Joi.string().required(),
  filter: Joi.string().max(Number(config.RESTHOOK_FILTER_MAX_LENGTH)).allow(''),
}).required();

/**
 * Get all hooks.
 * @returns {Array} all hooks
 */
function* getAllHooks() {
  return yield RestHook.find();
}

/**
 * Create hook.
 * @param {Object} data the request data
 * @returns {Object} the created hook
 */
function* createHook(data) {
  if (data.filter && data.filter.trim().length === 0) data.filter = null;

  const hook = yield RestHook.findOne({ topic: data.topic, endpoint: data.endpoint });
  if (hook) {
    throw new ConflictError('The hook is already defined.');
  }
  return yield RestHook.create(data);
}

createHook.schema = {
  data: hookSchema,
};

/**
 * Get hook.
 * @param {String} id the hook id
 * @returns {Object} the hook
 */
function* getHook(id) {
  return yield helper.ensureExists(RestHook, id);
}

getHook.schema = {
  id: Joi.string().required(),
};

/**
 * Update hook.
 * @param {String} id the hook id
 * @param {Object} data the request data
 * @returns {Object} the updated hook
 */
function* updateHook(id, data) {
  if (data.filter && data.filter.trim().length === 0) data.filter = null;

  const hk = yield RestHook.findOne({ topic: data.topic, endpoint: data.endpoint });
  if (hk && String(hk._id) !== id) {
    throw new ConflictError('The hook is already defined.');
  }

  const hook = yield helper.ensureExists(RestHook, id);
  _.assignIn(hook, data);
  return yield hook.save();
}

updateHook.schema = {
  id: Joi.string().required(),
  data: hookSchema,
};

/**
 * Delete hook.
 * @param {String} id the hook id
 */
function* deleteHook(id) {
  const hook = yield helper.ensureExists(RestHook, id);
  yield hook.remove();
}

deleteHook.schema = {
  id: Joi.string().required(),
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
