import React, { Component } from 'react';
import './bulma.min.css';
import './App.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import config from './config/config';
import RestHooks from './RestHooks';
import RestHookHistories from './RestHookHistories';
import AddHook from './AddHook';
import UpdateHook from './UpdateHook';
import RoleTopics from './RoleTopics';
import AddRoleTopics from './AddRoleTopics';
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
      // console.log(`current user token: ${token}`);
      sessionStorage.setItem('token', token);
      const user = decodeToken(token);
      user.isAdmin = user.roles && user.roles.indexOf(config.TC_ADMIN_ROLE) >= 0;
      this.setState({
        tokenV3: token,
        currentUser: user,
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
          <nav className="navbar is-transparent">
            <div className="container">
              <div className="navbar-brand">
                <a href="/" className="navbar-item">
                  <h1 className="is-size-3">VORBOTE</h1>
                </a>
              </div>
            </div>
          </nav>
        </div>
      )
    }

    return (
      <Router>
        <div className="App">
          <nav className="navbar is-transparent">
            <div className="container">
              <div className="navbar-brand">
                <a href="/" className="navbar-item">
                  <h1 className="is-size-3">VORBOTE</h1>
                </a>
              </div>
              <div className="navbar-menu">
                <div className="navbar-end">
                  <div className="navbar-item has-dropdown is-hoverable">
                    <a href="/" className="navbar-link">
                      Welcome, {this.state.currentUser.handle}
                    </a>
                    <div className="navbar-dropdown is-boxed">
                      <a onClick={this.logout} className="navbar-item">Logout</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <section className="section">
            <Route exact path="/" render={(props) => <RestHooks {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/addhook" render={(props) => <AddHook {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/updatehook/:id" render={(props) => <UpdateHook {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/hookhistories/:id" render={(props) => <RestHookHistories {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/roletopics" render={(props) => <RoleTopics {...props} currentUser={this.state.currentUser} />} />
            <Route exact path="/addroletopics" render={(props) => <AddRoleTopics {...props} currentUser={this.state.currentUser} />} />
          </section>
        </div>
      </Router>
    );
  }
}

export default App;
