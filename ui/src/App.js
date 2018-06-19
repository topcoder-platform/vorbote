import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import config from './config/config';
import RestHooks from './RestHooks';
import AddHook from './AddHook';
import UpdateHook from './UpdateHook';
import { getFreshToken, configureConnector, decodeToken } from './services/tc-auth';

class App extends Component {
  constructor() {
    super();
    this.state = {
      tokenV3: '',
      isLoggedIn: false,
      currentUser: null
    };
    configureConnector({
      connectorUrl: config.ACCOUNTS_APP_CONNECTOR,
      frameId: 'tc-accounts-iframe',
    });
  }

  componentDidMount() {
    this.authenticate()
  }

  authenticate() {
    return getFreshToken().then((token) => {
      const name = decodeToken(token);
      this.setState({
        tokenV3: token,
        currentUser: name,
        isLoggedIn: true,
      });
      return ({ token });
    }).catch((e) => {
      let url = `retUrl=${encodeURIComponent(config.APP_URL)}`;
      url = `${config.TC_AUTH_URL}/member?${url}`;
      location.href = url; // eslint-disable-line no-restricted-globals
      return ({});
    });
  }

  logout() {
    const url = `${config.TC_AUTH_URL}/#!/logout?retUrl=${encodeURIComponent(config.APP_URL)}`
    location.href = url; // eslint-disable-line no-restricted-globals
  }

  render() {
    if (!this.state.isLoggedIn) {
      return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Topcoder Event RestHooks Management</h1>
          </header>
        </div>
      )
    }
    return (
      <Router>
        <div className="App">
          <header className="App-header">
            <div className="logged-in-user">
              <p><span>Welcome, {this.state.currentUser.handle}</span></p>
              <a onClick={this.logout}>Logout</a>
            </div>
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Topcoder Event RestHooks Management</h1>
          </header>
          <div>
            <Route exact path="/" component={RestHooks} />
            <Route exact path="/addhook" render={(props) => <AddHook {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/updatehook/:id" render={(props) => <UpdateHook {...props} currentUser={this.state.currentUser} />} />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
