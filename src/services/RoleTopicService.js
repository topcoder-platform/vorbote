/**
 * Service for role topics.
 */

'use strict';

const _ = require('lodash');
const Joi = require('joi');
const RoleTopic = require('../models').RoleTopic;
const helper = require('../common/helper');
const ConflictError = require('../common/errors').ConflictError;

/**
 * Get topics for roles.
 * @param {Array} roles the roles
 * @returns {Array} topics for roles
 */
function* getTopics(roles) {
  if (!roles || roles.length === 0) {
    return [];
  }
  const rts = yield RoleTopic.find({ role: { $in: roles } }).sort('topic').select('topic');
  return _.map(rts, rt => rt.topic);
}

getTopics.schema = {
  roles: Joi.array().items(Joi.string().required()),
};

/**
 * Get role topics.
 * @param {Object} query the query parameters
 * @returns {Object} hooks result
 */
function* getRoleTopics(query) {
  const total = yield RoleTopic.count();
  const roleTopics = yield RoleTopic.find().sort('role topic').skip(query.offset).limit(query.limit);
  return { total, offset: query.offset, limit: query.limit, roleTopics };
}

getRoleTopics.schema = {
  query: Joi.object().keys({
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).default(10),
  }),
};

/**
 * Create role topic.
 * @param {Object} data the request data
 * @returns {Object} the created role topic
 */
function* create(data) {
  const rt = yield RoleTopic.findOne(data);
  if (rt) {
    throw new ConflictError('The role topic is already defined.');
  }
  return yield RoleTopic.create(data);
}

create.schema = {
  data: Joi.object().keys({
    role: Joi.string().required(),
    topic: Joi.string().required(),
  }).required(),
};

/**
 * Remove role topic.
 * @param {String} id the role topic id
 */
function* remove(id) {
  const rt = yield helper.ensureExists(RoleTopic, id);
  yield rt.remove();
}

remove.schema = {
  id: Joi.string().required(),
};

// Exports
module.exports = {
  getTopics,
  getRoleTopics,
  create,
  remove,
};
