import React, { Component } from 'react';
import './AddHook.css';
import API from './services/API';

class AddHook extends Component {
  constructor() {
    super();
    this.state = {
      topic: '',
      endpoint: ''
    };
    this.addHook = this.addHook.bind(this);
  }

  addHook() {
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
    API.createHook({ topic, endpoint, handle: _self.props.currentUser.handle }, () => {
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
        <button onClick={this.addHook}>Add</button>
        <button onClick={() => this.props.history.push('/')}>Cancel</button>
      </div>
    );
  }
}

export default AddHook;
