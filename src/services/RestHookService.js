/**
 * Service for REST hooks.
 */

'use strict';

const _ = require('lodash');
const config = require('config');
const Joi = require('joi');
const axios = require('axios');
const uuid = require('uuid/v4');
const helper = require('../common/helper');
const logger = require('../common/logger');
const ConflictError = require('../common/errors').ConflictError;
const ForbiddenError = require('../common/errors').ForbiddenError;
const RoleTopicService = require('./RoleTopicService');
const { VM } = require('vm2')

const hookSchema = Joi.object()
  .keys({
    name: Joi.string().max(50).required(),
    description: Joi.string().max(400).allow(''),
    topic: Joi.string().required(),
    endpoint: Joi.string().required(),
    filter: Joi.string()
      .max(Number(config.RESTHOOK_FILTER_MAX_LENGTH))
      .allow(''),
    headers: Joi.object().pattern(/.*/, Joi.string().required())
  })
  .required();

/**
 * Convert entity (rest hook or rest hook history), JSON string fields are parsed to object fields.
 * @param {Object} entity the entity to convert
 * @returns {Object} the converted entity
 */
function convertEntity(entity) {
  const obj = entity.toJSON ? entity.toJSON() : entity;
  if (obj.headers) {
    obj.headers = obj.headers.trim().length === 0 ? {} : JSON.parse(obj.headers);
  }
  if (obj.requestData) {
    obj.requestData = obj.requestData.trim().length === 0 ? {} : JSON.parse(obj.requestData);
  }
  return obj;
}

/**
 * Get all hooks.
 * @param {Object} query the query parameters
 * @returns {Object} hooks result
 */
function* getAllHooks(query) {
  const filter = {};
  if (query.owner) {
    filter.owner = { eq: query.owner };
  }
  let entities = yield helper.findAll('RestHook', filter);
  entities = _.sortBy(entities, ['id']);
  const total = entities.length;
  let hooks = entities.slice(query.offset, query.offset + query.limit);
  hooks = _.map(hooks, (hook) => convertEntity(hook));
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
      .default(10)
  })
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
      timeout: Number(config.AXIOS_TIMEOUT)
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

  if (data.headers) data.headers = JSON.stringify(data.headers);
  if (!data.filter || data.filter.trim().length === 0) data.filter = undefined;
  if (!data.description || data.description.trim().length === 0) data.description = undefined;

  const hook = yield helper.findOne('RestHook', { topic: { eq: data.topic }, endpoint: { eq: data.endpoint } });
  if (hook) {
    throw new ConflictError('The hook is already defined.');
  }
  data.owner = user.handle;

  // confirm endpoint
  data.confirmed = yield confirmEndpoint(data.endpoint);

  // eslint-disable-next-line no-console
  console.log(data);
  const createdHook = yield helper.create('RestHook',
    _.assignIn({ id: uuid(), createdAt: new Date().toISOString() }, data));
  return convertEntity(createdHook);
}

createHook.schema = {
  data: hookSchema,
  user: Joi.object().required()
};

/**
 * Get raw hook in db.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Object} the hook
 */
function* getRawHook(id, user) {
  const hook = yield helper.getById('RestHook', id);
  if (!user.isAdmin && hook.owner !== user.handle) {
    throw new ForbiddenError("You can not access other user's hook.");
  }
  return hook;
}

/**
 * Get hook.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Object} the hook
 */
function* getHook(id, user) {
  const hook = yield getRawHook(id, user);
  return convertEntity(hook);
}

getHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required()
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

  if (data.headers) data.headers = JSON.stringify(data.headers);

  const hk = yield helper.findOne('RestHook', { topic: { eq: data.topic }, endpoint: { eq: data.endpoint } });
  if (hk && hk.id !== id) {
    throw new ConflictError('The hook is already defined.');
  }

  const hook = yield getRawHook(id, user);

  // if endpoint is updated, then it needs to be re-confirmed
  if (data.endpoint !== hook.endpoint) {
    hook.confirmed = yield confirmEndpoint(data.endpoint);
  }

  _.assignIn(hook, data);
  if (!data.description || data.description.trim().length === 0) {
    hook.description = undefined;
  }
  if (!data.filter || data.filter.trim().length === 0) {
    hook.filter = undefined;
  }
  if (!data.headers) {
    hook.headers = undefined;
  }
  const updatedHook = yield helper.update(hook, { updatedAt: new Date().toISOString() });
  return convertEntity(updatedHook);
}

updateHook.schema = {
  id: Joi.string().required(),
  data: hookSchema,
  user: Joi.object().required()
};

/**
 * Delete hook.
 * @param {String} id the hook id
 * @param {Object} user the current user
 */
function* deleteHook(id, user) {
  const hook = yield getRawHook(id, user);
  yield hook.delete();
}

deleteHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required()
};

/**
 * Apply filter for a hook against given message.
 * @param {Object} hook the REST hook
 * @param {Object} message the message
 * @returns {Boolean} whether the hook should be called
 */
function filterHook(hook, message) {
  if (!hook.filter || hook.filter.trim().length === 0) {
    // there is no filter, then call the hook
    return true;
  }

  const filterFunc = 'eval(__FILTER_CODE)';
  const context = { __FILTER_CODE: hook.filter, message };
  try {
    const vm = new VM({
      sandbox: context
    })
    return !!vm.run(filterFunc)
  } catch (e) {
    logger.error(`Failed to filter hook: ${hook.filter}`);
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
    id: uuid(),
    hookId: hook.id,
    requestData: message ? JSON.stringify(message) : null,
    createdAt: new Date().toISOString()
  };
  // call hook endpoint
  try {
    const res = yield axios.post(hook.endpoint, message, {
      headers: hook.headers ? JSON.parse(hook.headers) : {},
      timeout: Number(config.AXIOS_TIMEOUT),
      validateStatus: () => true
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
    let histories = yield helper.findAll('RestHookHistory', { hookId: { eq: hook.id } });
    histories = _.sortBy(histories, ['createdAt']);
    for (let i = 0; i <= histories.length - Number(config.HOOK_HISTORY_COUNT); i += 1) {
      yield histories[i].delete();
    }

    // save history
    yield helper.create('RestHookHistory', history);
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
  const hooks = yield helper.findAll('RestHook', { topic: { eq: message.topic }, confirmed: { eq: true } });
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
  const hook = yield getRawHook(id, user);
  hook.confirmed = yield confirmEndpoint(hook.endpoint);
  const updatedHook = yield helper.update(hook, { updatedAt: new Date().toISOString() });
  return convertEntity(updatedHook);
}

confirmHook.schema = {
  id: Joi.string().required(),
  user: Joi.object().required()
};

/**
 * Get hook histories.
 * @param {String} id the hook id
 * @param {Object} user the current user
 * @returns {Array} the hook histories
 */
function* getHookHistories(id, user) {
  // ensure the hook exists and user can access it
  yield getRawHook(id, user);
  // find histories of given hook id
  let histories = yield helper.findAll('RestHookHistory', { hookId: { eq: id } });
  // sort by createdAt in descending order, so that latest histories will be shown first
  histories = _.sortBy(histories, ['createdAt']);
  _.reverse(histories);
  return _.map(histories, (h) => convertEntity(h));
}

getHookHistories.schema = {
  id: Joi.string().required(),
  user: Joi.object().required()
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
  getHookHistories
};
