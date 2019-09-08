import React, { Component } from 'react';
import _ from 'lodash';

import styles from './UpdateHook.css';
import API from './services/API';
import config from './config/config';

class UpdateHook extends Component {
  constructor() {
    super();
    this.state = {
      topic: '',
      endpoint: '',
      filter: '',
      topics: [],
      error: {},
    };
    this.updateHook = this.updateHook.bind(this);
  }

  componentDidMount() {
    const _self = this;
    API.getHook(this.props.match.params.id, (hook) => {
      _self.setState(hook);
    });
    API.getTopics((tps) => {
      _self.setState({ topics: tps });
    });
  }

  /**
   * Validate and call request to update hook
   */
  updateHook() {
    const _self = this;
    const { topic, endpoint, filter } = this.state;
    let error = {};

    if (!topic || topic.trim().length === 0) {
      error.topic = 'Topic is not selected.';
    }
    if (!endpoint || endpoint.trim().length === 0) {
      error.endpoint = 'Endpoint can not be empty.';
    }
    this.setState({ error });
    if (_.isEmpty(error)) {
      // no error from validation
      API.updateHook(this.props.match.params.id, { topic, endpoint, filter }, () => {
        _self.props.history.push('/');
      });
    }
  }

  render() {
    const { topics, error } = this.state;
    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <h5 className="is-size-5 has-text-grey-light">Edit resthook</h5>
          </div>
        </div>

        <div className="field">
          <div className="label">ID</div>
          <div className="control">
            { this.props.match.params.id }
          </div>
        </div>

        <div className="field">
          <div className="label">Topic*</div>
          <div className="control">
            <div className={`select ${error.topic ? 'is-danger' : ''}`}>
              <select
                value={this.state.topic}
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

        <div className="field">
          <div className="label">Endpoint*</div>
          <div className="control">
            <input
              placeholder="Resthook endpoint"
              className={`input ${error.endpoint ? 'is-danger' : ''}`}
              value={this.state.endpoint}
              onChange={ (e) => this.setState({ endpoint: e.target.value }) }
            />
          </div>
          {error.endpoint && (<p class="help is-danger">{error.endpoint}</p>)}
        </div>

        <div className="field">
          <div className="label">Rule</div>
          <div className="control">
            <textarea
              className="textarea"
              value={this.state.filter}
              rows="5"
              cols="120"
              placeholder="Enter your custom filter here"
              maxLength={Number(config.RESTHOOK_FILTER_MAX_LENGTH)}
              onChange={ (e) => this.setState({ filter: e.target.value }) }
            />
          </div>
        </div>

        <div className={`${styles.buttons} buttons`}>
          <a
            className="button pull-right is-primary"
            onClick={this.updateHook}
          >Update</a>
          <a
            className="button pull-right is-light"
            onClick={() => { this.props.history.push('/') }}
          >Cancel</a>
        </div>
      </div>
    );
  }
}

export default UpdateHook;
