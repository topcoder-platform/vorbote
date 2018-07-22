import React, { Component } from 'react';
import './RestHooks.css';
import API from './services/API';
import config from './config/config';

const pageSize = Number(config.PAGE_SIZE);

class RestHooks extends Component {
  constructor() {
    super();
    this.state = {
      hooks: [],
      page: 1,
      total: 0
    };
    this.deleteHook = this.deleteHook.bind(this);
    this.browsePage = this.browsePage.bind(this);
  }

  componentDidMount() {
    this.browsePage(1);
  }

  browsePage(p) {
    const _self = this;
    API.getAllHooks({ offset: (p - 1) * pageSize, limit: pageSize }, (res) => {
      _self.setState({ hooks: res.hooks, total: res.total, page: p });
    });
  }

  deleteHook(id) {
    const _self = this;
    API.deleteHook(id, () => {
      _self.browsePage(_self.state.page);
    });
  }

  render() {
    const { hooks, page, total } = this.state;
    let pageCount = Math.ceil(total / pageSize);
    if (pageCount < 1) pageCount = 1;
    const pages = [];
    for (let i = 1; i <= pageCount; i += 1) pages.push(i);

    return (
      <div>
        <table className="RestHooksTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Topic</th>
              <th>Endpoint</th>
              <th>Custom Filter Logic</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>

            { hooks.map((hook) => (
            <tr key={hook.id}>
              <td>{hook.id}</td>
              <td>{hook.topic}</td>
              <td>{hook.endpoint}</td>
              <td>{hook.filter}</td>
              <td>{hook.createdAt}</td>
              <td>{hook.updatedAt}</td>
              <td>
                <button onClick={() => { this.props.history.push('/updatehook/' + hook.id) }}>Update</button>
                <button onClick={() => this.deleteHook(hook.id)}>Delete</button>
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
        <button onClick={() => { this.props.history.push('/addhook') }}>Add Rest Hook</button>
        { this.props.currentUser.isAdmin && (
            <button onClick={() => { this.props.history.push('/roletopics') }}>Manage Role Topics</button>
          ) }
      </div>
    );
  }
}

export default RestHooks;
