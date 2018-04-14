import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import RestHooks from './RestHooks';
import AddHook from './AddHook';
import UpdateHook from './UpdateHook';

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Topcoder Event RestHooks Management</h1>
          </header>
          <Route exact path="/" component={RestHooks} />
          <Route exact path="/addhook" component={AddHook} />
          <Route exact path="/updatehook/:id" component={UpdateHook} />
        </div>
      </Router>
    );
  }
}

export default App;
