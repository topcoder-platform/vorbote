/**
 * Contains generic helper methods
 */
'use strict';

const _ = require('lodash');
const co = require('co');
const util = require('util');
const NotFoundError = require('./errors').NotFoundError;

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
 * Ensure entity exists for given criteria. Throw error if no result.
 * @param {Object} Model the mongoose model to query
 * @param {Object|String} criteria the criteria (if object) or id (if string)
 */
function* ensureExists(Model, criteria) {
  let query;
  let byId = true;
  if (_.isObject(criteria)) {
    byId = false;
    query = Model.findOne(criteria);
  } else {
    query = Model.findById(criteria);
  }
  const result = yield query;
  if (!result) {
    let msg;
    if (byId) {
      msg = util.format('%s not found with id: %s', Model.modelName, criteria);
    } else {
      msg = util.format('%s not found with criteria: %j', Model.modelName, criteria);
    }
    throw new NotFoundError(msg);
  }
  return result;
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  ensureExists,
};
