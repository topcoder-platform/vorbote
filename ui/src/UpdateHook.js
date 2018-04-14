import React, { Component } from 'react';
import './UpdateHook.css';
import API from './services/API';

class UpdateHook extends Component {
  constructor() {
    super();
    this.state = {
      topic: '',
      endpoint: ''
    };
    this.updateHook = this.updateHook.bind(this);
  }

  componentDidMount() {
    const _self = this;
    API.getHook(this.props.match.params.id, (hook) => {
      _self.setState(hook);
    });
  }

  updateHook() {
    const _self = this;
    const { topic, endpoint } = this.state;
    if (!topic || topic.trim().length === 0) {
      alert('Topic can not be empty.');
      return;
    }
    if (!endpoint || endpoint.trim().length === 0) {
      alert('Endpoint can not be empty.');
      return;
    }
    API.updateHook(this.props.match.params.id, { topic, endpoint }, () => {
      _self.props.history.push('/');
    });
  }

  render() {
    return (
      <div>
        <div className="Row">
          <div className="Label">ID:</div> { this.props.match.params.id }
        </div>
        <div className="Row">
          <div className="Label">Topic:</div> <input value={this.state.topic}
            onChange={ (e) => this.setState({ topic: e.target.value }) } />
        </div>
        <div className="Row">
          <div className="Label">Endpoint:</div> <input value={this.state.endpoint}
            onChange={ (e) => this.setState({ endpoint: e.target.value }) } />
        </div>
        <button onClick={this.updateHook}>Update</button>
        <button onClick={() => this.props.history.push('/')}>Cancel</button>
      </div>
    );
  }
}

export default UpdateHook;
