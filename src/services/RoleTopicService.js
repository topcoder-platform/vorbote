/**
 * Service for role topics.
 */

'use strict';

const _ = require('lodash');
const Joi = require('joi');
const uuid = require('uuid/v4');
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
  const entities = yield helper.findAll('RoleTopic', { role: { in: roles } });
  const topics = [];
  _.forEach(entities, (e) => {
    if (!_.includes(topics, e.topic)) {
      topics.push(e.topic);
    }
  });
  return _.sortBy(topics);
}

getTopics.schema = {
  roles: Joi.array().items(Joi.string().required())
};

/**
 * Get role topics.
 * @param {Object} query the query parameters
 * @returns {Object} hooks result
 */
function* getRoleTopics(query) {
  let entities = yield helper.findAll('RoleTopic', {});
  entities = _.sortBy(entities, ['role', 'topic']);
  const total = entities.length;
  const roleTopics = entities.slice(query.offset, query.offset + query.limit);
  return { total, offset: query.offset, limit: query.limit, roleTopics };
}

getRoleTopics.schema = {
  query: Joi.object().keys({
    offset: Joi.number().integer().min(0).default(0),
    limit: Joi.number().integer().min(1).default(10)
  })
};

/**
 * Create role topic.
 * @param {Object} data the request data
 * @returns {Object} the created role topic
 */
function* create(data) {
  const rt = yield helper.findOne('RoleTopic', { role: { eq: data.role }, topic: { eq: data.topic } });
  if (rt) {
    throw new ConflictError('The role topic is already defined.');
  }
  return yield helper.create('RoleTopic', {
    id: uuid(),
    role: data.role,
    topic: data.topic,
    createdAt: new Date().toISOString()
  });
}

create.schema = {
  data: Joi.object().keys({
    role: Joi.string().required(),
    topic: Joi.string().required()
  }).required()
};

/**
 * Remove role topic.
 * @param {String} id the role topic id
 */
function* remove(id) {
  const rt = yield helper.getById('RoleTopic', id);
  yield rt.delete();
}

remove.schema = {
  id: Joi.string().required()
};

// Exports
module.exports = {
  getTopics,
  getRoleTopics,
  create,
  remove
};
