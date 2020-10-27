'use strict';

module.exports = {
  '/hooks': {
    get: {
      controller: 'RestHookController',
      method: 'getAllHooks'
    },
    post: {
      controller: 'RestHookController',
      method: 'createHook'
    }
  },
  '/hooks/:id': {
    get: {
      controller: 'RestHookController',
      method: 'getHook'
    },
    put: {
      controller: 'RestHookController',
      method: 'updateHook'
    },
    delete: {
      controller: 'RestHookController',
      method: 'deleteHook'
    }
  },
  '/hooks/:id/histories': {
    get: {
      controller: 'RestHookController',
      method: 'getHookHistories'
    }
  },
  '/hooks/:id/confirm': {
    post: {
      controller: 'RestHookController',
      method: 'confirmHook'
    }
  },
  '/topics': {
    get: {
      controller: 'RoleTopicController',
      method: 'getTopics'
    }
  },
  '/roletopics': {
    get: {
      controller: 'RoleTopicController',
      method: 'getRoleTopics',
      admin: true
    },
    post: {
      controller: 'RoleTopicController',
      method: 'create',
      admin: true
    }
  },
  '/roletopics/:id': {
    delete: {
      controller: 'RoleTopicController',
      method: 'remove',
      admin: true
    }
  }
};
