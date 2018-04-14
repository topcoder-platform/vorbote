import superagent from 'superagent';
import config from '../config/config';

const API = {

  getAllHooks: (cb) => {
    superagent.get(`${config.API_URL}/hooks`).end((err, res) => {
      if (err) {
        alert(`Failed to get hooks. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  getHook: (id, cb) => {
    superagent.get(`${config.API_URL}/hooks/${id}`).end((err, res) => {
      if (err) {
        alert(`Failed to get hook. ${ err }`);
      } else {
        cb(res.body);
      }
    });
  },

  createHook: (data, cb) => {
    superagent.post(`${config.API_URL}/hooks`).send(data).end((err, res) => {
      if (err) {
        alert(`Failed to create hook. ${ res.status === 409 ? 'The hook is already defined.' : err }`);
      } else {
        cb(res.body);
      }
    });
  },

  updateHook: (id, data, cb) => {
    superagent.put(`${config.API_URL}/hooks/${id}`).send(data).end((err, res) => {
      if (err) {
        alert(`Failed to update hook. ${ res.status === 409 ? 'The hook is already defined.' : err }`);
      } else {
        cb(res.body);
      }
    });
  },

  deleteHook: (id, cb) => {
    superagent.del(`${config.API_URL}/hooks/${id}`).end((err) => {
      if (err) {
        alert(`Failed to delete hook. ${ err }`);
      } else {
        cb();
      }
    });
  },

};

export default API;
