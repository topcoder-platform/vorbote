/**
 * Service for REST hooks.
 */

'use strict';

const _ = require('lodash');
const Joi = require('joi');
const axios = require('axios');
const RestHook = require('../models').RestHook;
const helper = require('../common/helper');
const logger = require('../common/logger');
const ConflictError = require('../common/errors').ConflictError;

const hookSchema = Joi.object().keys({
  topic: Joi.string().required(),
  endpoint: Joi.string().required(),
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
  const hook = yield RestHook.findOne(data);
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
  const hk = yield RestHook.findOne(data);
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
 * Notify hooks of given message.
 * @param {Object} message the message
 */
function* notifyHooks(message) {
  // find hooks of message topic
  const hooks = yield RestHook.find({ topic: message.topic });
  // notify each hook in parallel
  yield _.map(hooks, (hook) => axios.post(hook.endpoint, message).catch((err) => logger.error(err)));
}

notifyHooks.schema = {
  message: Joi.object().keys({
    topic: Joi.string().required(),
    originator: Joi.string().required(),
    timestamp: Joi.string().required(),
    'mime-type': Joi.string().required(),
    payload: Joi.any(),
  }).required(),
};

// Exports
module.exports = {
  getAllHooks,
  createHook,
  getHook,
  updateHook,
  deleteHook,
  notifyHooks,
};
