/**
 * Contains endpoints related to REST hooks.
 */
'use strict';

const RestHookService = require('../services/RestHookService');

/**
 * Get all hooks.
 * @param req the request
 * @param res the response
 */
function* getAllHooks(req, res) {
  if (!req.user.isAdmin) {
    req.query.handle = req.user.handle;
  }
  res.json(yield RestHookService.getAllHooks(req.query));
}

/**
 * Create hook.
 * @param req the request
 * @param res the response
 */
function* createHook(req, res) {
  res.json(yield RestHookService.createHook(req.body, req.user));
}

/**
 * Get hook.
 * @param req the request
 * @param res the response
 */
function* getHook(req, res) {
  res.json(yield RestHookService.getHook(req.params.id, req.user));
}

/**
 * Update hook.
 * @param req the request
 * @param res the response
 */
function* updateHook(req, res) {
  res.json(yield RestHookService.updateHook(req.params.id, req.body, req.user));
}

/**
 * Delete hook.
 * @param req the request
 * @param res the response
 */
function* deleteHook(req, res) {
  yield RestHookService.deleteHook(req.params.id, req.user);
  res.status(200).end();
}

// Exports
module.exports = {
  getAllHooks,
  createHook,
  getHook,
  updateHook,
  deleteHook,
};
