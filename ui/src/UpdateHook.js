import React, { Component } from 'react';
import _ from 'lodash';

import styles from './UpdateHook.css';
import API from './services/API';
import config from './config/config';
import IconDelete from './assets/images/icon-delete.svg';

class UpdateHook extends Component {
  constructor() {
    super();
    this.state = {
      name: '',
      description: '',
      topic: '',
      endpoint: '',
      filter: '',
      headers: [],
      headerName: '',
      headerValue: '',
      topics: [],
      error: {},
    };
    this.updateHook = this.updateHook.bind(this);
    this.addHeader = this.addHeader.bind(this);
    this.deleteHeader = this.deleteHeader.bind(this);
  }

  componentDidMount() {
    const _self = this;
    API.getHook(this.props.match.params.id, (hook) => {
      const hds = [];
      _.forIn(hook.headers || {}, (value, name) => {
        hds.push({ name, value });
      });
      _self.setState({
        name: hook.name,
        description: hook.description || '',
        topic: hook.topic,
        endpoint: hook.endpoint,
        filter: hook.filter || '',
        headers: hds,
      });
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
    const { name, description, topic, endpoint, filter, headers } = this.state;
    let error = {};
    if (!name || name.trim().length === 0) {
      error.name = 'Name can not be empty.';
    }
    if (!topic || topic.trim().length === 0) {
      error.topic = 'Topic is not selected.';
    }
    if (!endpoint || endpoint.trim().length === 0) {
      error.endpoint = 'Endpoint can not be empty.';
    } else if (config.REQUIRE_HTTPS_HOOK && !_.startsWith(endpoint.trim().toLowerCase(), 'https://')) {
      error.endpoint = 'Endpoint must use HTTPS protocol.';
    }
    this.setState({ error });
    if (_.isEmpty(error)) {
      // no error from validation
      const hds = {};
      _.forEach(headers, (hd) => {
        hds[hd.name] = hd.value;
      });
      API.updateHook(this.props.match.params.id, { name, description, headers: hds, topic, endpoint, filter }, () => {
        _self.props.history.push('/');
      });
    }
  }

  addHeader() {
    const { headers, headerName, headerValue } = this.state;
    const error = {};
    if (!headerName || headerName.trim().length === 0) {
      error.headerName = 'Header name can not be empty.';
    }
    if (_.find(headers, (item) => item.name === headerName)) {
      error.headerName = 'Header name is already defined.';
    }
    if (!headerValue || headerValue.trim().length === 0) {
      error.headerValue = 'Header value can not be empty.';
    }
    if (headers.length >= config.RESTHOOK_HEADERS_COUNT) {
      error.addHeader = `At most ${config.RESTHOOK_HEADERS_COUNT} headers can be defined.`
    }
    this.setState({ error });
    if (_.isEmpty(error)) {
      headers.push({ name: headerName, value: headerValue })
      this.setState({ headers, headerName: '', headerValue: '' });
    }
  }

  deleteHeader(index) {
    const { headers } = this.state;
    headers.splice(index, 1);
    this.setState({ headers });
  }

  render() {
    const { headers, topics, error } = this.state;
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
          <div className="label">Name*</div>
          <div className="control">
            <input
              placeholder="Resthook name"
              className={`input ${error.name ? 'is-danger' : ''}`}
              value={this.state.name}
              maxLength={50}
              onChange={ (e) => this.setState({ name: e.target.value }) }
            />
          </div>
          {error.name && (<p class="help is-danger">{error.name}</p>)}
        </div>

        <div className="field">
          <div className="label">Description</div>
          <div className="control">
            <textarea
              className="textarea"
              value={this.state.description}
              rows="5"
              cols="120"
              placeholder="Enter your description here"
              maxLength={400}
              onChange={ (e) => this.setState({ description: e.target.value }) }
            />
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

        <div className="field">
          <div className="label">Headers</div>
          <div className="control">
            <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
              <thead className="thead">
                <tr>
                  <th className="has-text-centered">NAME</th>
                  <th className="has-text-centered">VALUE</th>
                  <th className="has-text-centered">ACTION</th>
                </tr>
              </thead>
              <tbody className="tbody">
                { headers.map((item, index) => (
                  <tr key={index}>
                    <td className="has-text-centered">{item.name}</td>
                    <td className="has-text-centered">{item.value}</td>
                    <td className="has-text-centered">
                      <a
                        onClick={() => this.deleteHeader(index)}
                        className="button is-danger is-link"
                      >
                        <img
                          className="svg svg-inline--fa fa-trash-alt fa-w-14"
                          width="14"
                          height="16"
                          src={IconDelete}
                          alt="Icon Delete"
                        />
                      </a>
                    </td>
                  </tr>
                )) }
              </tbody>
            </table>
          </div>
        </div>

        <div className="field">
          <div className="label">New header name</div>
          <div className="control">
            <input
              placeholder="Header name"
              className={`input ${error.headerName ? 'is-danger' : ''}`}
              value={this.state.headerName}
              onChange={ (e) => this.setState({ headerName: e.target.value }) }
            />
          </div>
          {error.headerName && (<p class="help is-danger">{error.headerName}</p>)}
        </div>

        <div className="field">
          <div className="label">New header value</div>
          <div className="control">
            <input
              placeholder="Header value"
              className={`input ${error.headerValue ? 'is-danger' : ''}`}
              value={this.state.headerValue}
              onChange={ (e) => this.setState({ headerValue: e.target.value }) }
            />
          </div>
          {error.headerValue && (<p class="help is-danger">{error.headerValue}</p>)}
        </div>

        <div className={`${styles.buttons} buttons`}>
          <a
            className="button pull-right is-primary"
            onClick={this.addHeader}
          >Add Header</a>
          {error.addHeader && (<p class="help is-danger">{error.addHeader}</p>)}
        </div>

        <div className={`${styles.buttons} buttons`}>
          <a
            className="button pull-right is-primary"
            onClick={this.updateHook}
          >Update Hook</a>
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
