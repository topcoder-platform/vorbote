import React, { Component } from 'react';
import './AddHook.css';
import API from './services/API';
import config from './config/config';

class AddHook extends Component {
  constructor() {
    super();
    this.state = {
      topic: '',
      endpoint: '',
      filter: ''
    };
    this.addHook = this.addHook.bind(this);
  }

  addHook() {
    const _self = this;
    const { topic, endpoint, filter } = this.state;
    if (!topic || topic.trim().length === 0) {
      alert('Topic can not be empty.');
      return;
    }
    if (!endpoint || endpoint.trim().length === 0) {
      alert('Endpoint can not be empty.');
      return;
    }
    API.createHook({ topic, endpoint, filter, handle: _self.props.currentUser.handle }, () => {
      _self.props.history.push('/');
    });
  }

  render() {
    return (
      <div>
        <div className="Row">
          <div className="Label">Topic:</div> <input value={this.state.topic}
            onChange={ (e) => this.setState({ topic: e.target.value }) } />
        </div>
        <div className="Row">
          <div className="Label">Endpoint:</div> <input value={this.state.endpoint}
            onChange={ (e) => this.setState({ endpoint: e.target.value }) } />
        </div>
        <div className="Row">
          <div className="Label">Custom Filter Logic:</div> <textarea value={this.state.filter}
            rows="5" cols="120" maxLength={Number(config.RESTHOOK_FILTER_MAX_LENGTH)}
            onChange={ (e) => this.setState({ filter: e.target.value }) } />
        </div>
        <button onClick={this.addHook}>Add</button>
        <button onClick={() => this.props.history.push('/')}>Cancel</button>
      </div>
    );
  }
}

export default AddHook;
