import React, { Component } from 'react';
import _ from 'lodash';

import styles from './AddRoleTopics.css';
import API from './services/API';

class AddRoleTopics extends Component {
  constructor() {
    super();
    this.state = {
      role: '',
      topic: '',
      topics: [],
      error: {},
    };
    this.addRoleTopic = this.addRoleTopic.bind(this);
  }

  componentDidMount() {
    const _self = this;
    API.getTopics((tps) => {
      _self.setState({ topics: tps });
    });
  }

  /**
   * Validate and call request to add new role topic
   */
  addRoleTopic() {
    const _self = this;
    const { role, topic } = this.state;
    let error = {};
    if (!role || role.trim().length === 0) {
      error.role = 'Role can not be empty.';
    }
    if (!topic || topic.trim().length === 0) {
      error.topic = 'Topic is not selected.';
    }
    this.setState({ error });
    if (_.isEmpty(error)) {
      // no error from validation
      API.createRoleTopic({ role, topic }, () => {
        _self.props.history.push('/roletopics')
      });
    }
  }

  render() {
    if (!this.props.currentUser.isAdmin) return null;

    const { topics, error } = this.state;

    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <h5 className="is-size-5 has-text-grey-light">Create new role topic</h5>
          </div>
        </div>

        <div className="field">
          <div className="label">Role*</div>
          <div className="control">
            <input
              className={`input ${error.role ? 'is-danger' : ''}`}
              value={this.state.role}
              onChange={ (e) => this.setState({ role: e.target.value }) }
            />
          </div>
          {error.role && (<p class="help is-danger">{error.role}</p>)}
        </div>

        <div className="field">
          <div className="label">Topic*</div>
          <div className="control">
            <div className={`select ${error.topic ? 'is-danger' : ''}`}>
              <select
                onChange={ (e) => this.setState({ topic: e.target.value }) }>
                  <option value="">Select Topic</option>
                  { topics.map((tp, index) => (
                      <option key={index}>{tp}</option>
                    )) }
              </select>
            </div>
          </div>
          {error.topic && (<p class="help is-danger">{error.topic}</p>)}
        </div>

        <div className={`${styles.buttons} buttons`}>
          <a
            className="button pull-right is-primary"
            onClick={this.addRoleTopic}
          >Add</a>
          <a
            className="button pull-right is-light"
            onClick={() => { this.props.history.push('/roletopics') }}
          >Cancel</a>
        </div>

      </div>
    );
  }
}

export default AddRoleTopics;
