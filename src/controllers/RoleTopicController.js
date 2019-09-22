/**
 * Contains endpoints related to role topics.
 */
'use strict';

const RoleTopicService = require('../services/RoleTopicService');

/**
 * Get topics.
 * @param req the request
 * @param res the response
 */
function* getTopics(req, res) {
  if (req.user.isAdmin) {
    // for admin, get all topics
    res.json(req.topics || []);
  } else {
    // for non-admin, get allowed topics for roles of the current user
    res.json(yield RoleTopicService.getTopics(req.user.roles));
  }
}

/**
 * Get role topics.
 * @param req the request
 * @param res the response
 */
function* getRoleTopics(req, res) {
  res.json(yield RoleTopicService.getRoleTopics(req.query));
}

/**
 * Create role topic.
 * @param req the request
 * @param res the response
 */
function* create(req, res) {
  res.json(yield RoleTopicService.create(req.body));
}

/**
 * Remove role topic.
 * @param req the request
 * @param res the response
 */
function* remove(req, res) {
  yield RoleTopicService.remove(req.params.id);
  res.status(200).end();
}

// Exports
module.exports = {
  getTopics,
  getRoleTopics,
  create,
  remove,
};
