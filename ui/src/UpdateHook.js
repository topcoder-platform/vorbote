import React, { Component } from 'react';
import './UpdateHook.css';
import API from './services/API';
import config from './config/config';

class UpdateHook extends Component {
  constructor() {
    super();
    this.state = {
      topic: '',
      endpoint: '',
      filter: '',
      topics: []
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

  updateHook() {
    const _self = this;
    const { topic, endpoint, filter } = this.state;
    if (!topic || topic.trim().length === 0) {
      alert('Topic is not selected.');
      return;
    }
    if (!endpoint || endpoint.trim().length === 0) {
      alert('Endpoint can not be empty.');
      return;
    }
    API.updateHook(this.props.match.params.id, { topic, endpoint, filter }, () => {
      _self.props.history.push('/');
    });
  }

  render() {
    const { topics } = this.state;
    return (
      <div>
        <div className="Row">
          <div className="Label">ID:</div> { this.props.match.params.id }
        </div>
        <div className="Row">
          <div className="Label">Topic:</div> <select value={this.state.topic}
            onChange={ (e) => this.setState({ topic: e.target.value }) }>
              <option value="">Select Topic</option>
              { topics.map((tp, index) => (
                  <option key={index}>{tp}</option>
                )) }
              }
            </select>
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
        <button onClick={this.updateHook}>Update</button>
        <button onClick={() => this.props.history.push('/')}>Cancel</button>
      </div>
    );
  }
}

export default UpdateHook;
