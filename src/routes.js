'use strict';

module.exports = {
  '/hooks': {
    get: {
      controller: 'RestHookController',
      method: 'getAllHooks',
    },
    post: {
      controller: 'RestHookController',
      method: 'createHook',
    },
  },
  '/hooks/:id': {
    get: {
      controller: 'RestHookController',
      method: 'getHook',
    },
    put: {
      controller: 'RestHookController',
      method: 'updateHook',
    },
    delete: {
      controller: 'RestHookController',
      method: 'deleteHook',
    },
  },
};
