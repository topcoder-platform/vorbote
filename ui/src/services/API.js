import superagent from 'superagent';
import config from '../config/config';

const getToken = () => sessionStorage.getItem('token');

const API = {

  getAllHooks: (query, cb) => {
    superagent.get(`${config.API_URL}/hooks`).set('Authorization', `Bearer ${getToken()}`).query(query).end((err, res) => {
      if (err) {
        alert(`Failed to get hooks. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  getHook: (id, cb) => {
    superagent.get(`${config.API_URL}/hooks/${id}`).set('Authorization', `Bearer ${getToken()}`).end((err, res) => {
      if (err) {
        alert(`Failed to get hook. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  confirmHook: (id, cb) => {
    superagent
      .post(`${config.API_URL}/hooks/${id}/confirm`)
      .set('Authorization', `Bearer ${getToken()}`)
      .timeout(Number(config.CONFIRM_HOOK_TIMEOUT))
      .end((err, res) => {
      if (err) {
        cb({ confirmed: false });
      } else {
        cb({ confirmed: res.body.confirmed });
      }
    });
  },

  createHook: (data, cb) => {
    superagent.post(`${config.API_URL}/hooks`).set('Authorization', `Bearer ${getToken()}`).send(data).end((err, res) => {
      if (err) {
        alert(`Failed to create hook. ${ res.status === 409 ? 'The hook is already defined.' : err }`);
      } else {
        cb(res.body);
      }
    });
  },

  updateHook: (id, data, cb) => {
    superagent.put(`${config.API_URL}/hooks/${id}`).set('Authorization', `Bearer ${getToken()}`).send(data).end((err, res) => {
      if (err) {
        alert(`Failed to update hook. ${ res.status === 409 ? 'The hook is already defined.' : err }`);
      } else {
        cb(res.body);
      }
    });
  },

  deleteHook: (id, cb) => {
    superagent.del(`${config.API_URL}/hooks/${id}`).set('Authorization', `Bearer ${getToken()}`).end((err) => {
      if (err) {
        alert(`Failed to delete hook. ${ err }`);
      } else {
        cb();
      }
    });
  },

  getHookHistories: (id, cb) => {
    superagent.get(`${config.API_URL}/hooks/${id}/histories`).set('Authorization', `Bearer ${getToken()}`).end((err, res) => {
      if (err) {
        alert(`Failed to get REST hook histories. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  getTopics: (cb) => {
    superagent.get(`${config.API_URL}/topics`).set('Authorization', `Bearer ${getToken()}`).end((err, res) => {
      if (err) {
        alert(`Failed to get topics. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  getRoleTopics: (query, cb) => {
    superagent.get(`${config.API_URL}/roletopics`).set('Authorization', `Bearer ${getToken()}`).query(query).end((err, res) => {
      if (err) {
        alert(`Failed to get role topics. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  createRoleTopic: (data, cb) => {
    superagent.post(`${config.API_URL}/roletopics`).set('Authorization', `Bearer ${getToken()}`).send(data).end((err, res) => {
      if (err) {
        alert(`Failed to create role topic. ${ res.status === 409 ? 'The role topic is already defined.' : err }`);
      } else {
        cb(res.body);
      }
    });
  },

  deleteRoleTopic: (id, cb) => {
    superagent.del(`${config.API_URL}/roletopics/${id}`).set('Authorization', `Bearer ${getToken()}`).end((err) => {
      if (err) {
        alert(`Failed to delete role topic. ${ err }`);
      } else {
        cb();
      }
    });
  },
};

export default API;
