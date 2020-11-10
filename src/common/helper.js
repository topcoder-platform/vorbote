/**
 * Contains generic helper methods
 */
'use strict';

const _ = require('lodash');
const co = require('co');
const util = require('util');
const errors = require('./errors');
const models = require('../models');

/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress(fn) {
  return function (req, res, next) {
    co(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap all generators from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress(obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress);
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'GeneratorFunction') {
      return wrapExpress(obj);
    }
    return obj;
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value);
  });
  return obj;
}

/**
 * Get Data by model id
 * @param {Object} modelName The dynamoose model name
 * @param {String} id The id value
 * @returns the entity of given id
 */
function* getById (modelName, id) {
  return yield new Promise((resolve, reject) => {
    models[modelName].query('id').eq(id).exec((err, result) => {
      if (err) {
        return reject(err);
      }
      if (result.length > 0) {
        return resolve(result[0]);
      } else {
        return reject(new errors.NotFoundError(`${modelName} with id: ${id} doesn't exist`));
      }
    });
  });
}

/**
 * Create item in database
 * @param {Object} modelName The dynamoose model name
 * @param {Object} data The create data object
 * @returns created entity
 */
function* create (modelName, data) {
  return yield new Promise((resolve, reject) => {
    const dbItem = new models[modelName](data);
    dbItem.save((err) => {
      if (err) {
        return reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Update item in database
 * @param {Object} dbItem The Dynamo database item
 * @param {Object} data The updated data object
 * @returns updated entity
 */
function* update (dbItem, data) {
  Object.keys(data).forEach((key) => {
    dbItem[key] = data[key];
  });
  return yield new Promise((resolve, reject) => {
    dbItem.save((err) => {
      if (err) {
        return reject(err);
      }

      return resolve(dbItem);
    });
  });
}

/**
 * Get data collection by scan parameters
 * @param {Object} modelName The dynamoose model name
 * @param {Object} scanParams The scan parameters object
 * @param {Object} lastKey the last key of the previous scan, optional
 * @param {Number} limit the limit count of scan, optional
 * @returns scanned entities
 */
function* scan (modelName, scanParams, lastKey, limit) {
  return yield new Promise((resolve, reject) => {
    let op = models[modelName].scan(scanParams || {});
    if (lastKey) {
      op = op.startAt(lastKey);
    }
    if (limit) {
      op = op.limit(limit);
    }
    op.exec((err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result.count === 0 ? [] : result);
    });
  });
}

/**
 * Find all matched entities.
 * @param {Object} modelName The dynamoose model name
 * @param {Object} criteria the criteria
 * @returns found entities
 */
function* findAll (modelName, criteria) {
  let result = [];
  let lastKey = null;
  for (;;) {
    const entities = yield scan(modelName, criteria, lastKey);
    if (!entities || entities.length === 0) {
      break;
    }
    result = result.concat(entities);
    if (!entities.lastKey) {
      break;
    }
    lastKey = entities.lastKey;
  }
  return result;
}

/**
 * Find one matched entity.
 * @param {Object} modelName The dynamoose model name
 * @param {Object} criteria the criteria
 * @returns found entity, or null if not found
 */
function* findOne (modelName, criteria) {
  const entities = yield findAll(modelName, criteria);
  if (entities.length === 0) {
    return null;
  }
  return entities[0];
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getById,
  create,
  update,
  findAll,
  findOne,
  scan
};
