import React, { Component } from 'react';
import './RoleTopics.css';
import API from './services/API';
import config from './config/config';

const pageSize = Number(config.PAGE_SIZE);

class RoleTopics extends Component {
  constructor() {
    super();
    this.state = {
      items: [],
      page: 1,
      total: 0,
      role: '',
      topic: '',
      topics: []
    };
    this.deleteRoleTopic = this.deleteRoleTopic.bind(this);
    this.addRoleTopic = this.addRoleTopic.bind(this);
    this.browsePage = this.browsePage.bind(this);
  }

  componentDidMount() {
    this.browsePage(1);
    const _self = this;
    API.getTopics((tps) => {
      _self.setState({ topics: tps });
    });
  }

  browsePage(p) {
    const _self = this;
    API.getRoleTopics({ offset: (p - 1) * pageSize, limit: pageSize }, (res) => {
      _self.setState({ items: res.roleTopics, total: res.total, page: p });
    });
  }

  deleteRoleTopic(id) {
    const _self = this;
    API.deleteRoleTopic(id, () => {
      _self.browsePage(_self.state.page);
    });
  }

  addRoleTopic() {
    const _self = this;
    const { role, topic } = this.state;
    if (!role || role.trim().length === 0) {
      alert('Role can not be empty.');
      return;
    }
    if (!topic || topic.trim().length === 0) {
      alert('Topic is not selected.');
      return;
    }
    API.createRoleTopic({ role, topic }, () => {
      _self.browsePage(_self.state.page);
    });
  }

  render() {
    if (!this.props.currentUser.isAdmin) return null;

    const { items, page, total, topics } = this.state;
    let pageCount = Math.ceil(total / pageSize);
    if (pageCount < 1) pageCount = 1;
    const pages = [];
    for (let i = 1; i <= pageCount; i += 1) pages.push(i);

    return (
      <div>
        <table className="RoleTopicsTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Role</th>
              <th>Topic</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>

            { items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.role}</td>
              <td>{item.topic}</td>
              <td>{item.createdAt}</td>
              <td>
                <button onClick={() => this.deleteRoleTopic(item.id)}>Delete</button>
              </td>
            </tr>
              )) }

          </tbody>
        </table>
        <br/>
        Page:
          { pages.map((p) => (
              p === page ? (
                  <button key={p} className="CurrentPage">{p}</button>
                ) : (
                  <button key={p} onClick={() => this.browsePage(p)}>{p}</button>
                )
            )) }
        <br/>
        <div className="Row">
          <div className="Label">Role:</div> <input value={this.state.role}
            onChange={ (e) => this.setState({ role: e.target.value }) } />
          <div className="Label">Topic:</div> <select
            onChange={ (e) => this.setState({ topic: e.target.value }) }>
              <option value="">Select Topic</option>
              { topics.map((tp, index) => (
                  <option key={index}>{tp}</option>
                )) }
              }
            </select>
          <button className="AddRoleTopicBtn" onClick={this.addRoleTopic}>Add</button>
        </div>
        <div className="Row">
          <button onClick={() => this.props.history.push('/')}>Back To Home</button>
        </div>
      </div>
    );
  }
}

export default RoleTopics;
