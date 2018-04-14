import React, { Component } from 'react';
import './RestHooks.css';
import API from './services/API';

class RestHooks extends Component {
  constructor() {
    super();
    this.state = {
      hooks: []
    };
    this.deleteHook = this.deleteHook.bind(this);
  }

  componentDidMount() {
    const _self = this;
    API.getAllHooks((hooks) => {
      _self.setState({ hooks });
    });
  }

  deleteHook(id) {
    const _self = this;
    API.deleteHook(id, () => {
      API.getAllHooks((hooks) => {
        _self.setState({ hooks });
      });
    });
  }

  render() {
    const { hooks } = this.state;
    return (
      <div>
        <table className="RestHooksTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Topic</th>
              <th>Endpoint</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>

            { hooks.map((hook) => (
            <tr key={hook.id}>
              <td>{hook.id}</td>
              <td>{hook.topic}</td>
              <td>{hook.endpoint}</td>
              <td>
                <button onClick={() => { this.props.history.push('/updatehook/' + hook.id) }}>Update</button>
                <button onClick={() => this.deleteHook(hook.id)}>Delete</button>
              </td>
            </tr>
              )) }

          </tbody>
        </table>
        <br/>
        <button onClick={() => { this.props.history.push('/addhook') }}>Add Rest Hook</button>
      </div>
    );
  }
}

export default RestHooks;
