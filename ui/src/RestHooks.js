import React, { Component } from 'react';
import _ from 'lodash';
import moment from 'moment';
import styles from './RestHooks.css';
import API from './services/API';
import config from './config/config';
import IconEdit from './assets/images/icon-edit.svg';
import IconDelete from './assets/images/icon-delete.svg';
import IconView from './assets/images/icon-view.svg';
import IconDots from './assets/images/icon-dots.svg';
import Popup from 'reactjs-popup';

const pageSize = Number(config.PAGE_SIZE);

class RestHooks extends Component {
  constructor() {
    super();
    this.state = {
      hooks: [],
      page: 1,
      keys: [undefined],
      selectedFilter: '',
      loading: {}
    };
    this.deleteHook = this.deleteHook.bind(this);
    this.browsePage = this.browsePage.bind(this);
    this.confirmHook = this.confirmHook.bind(this);
  }

  componentDidMount() {
    this.browsePage(1);
  }

  componentWillUnmount() {
    this.destroyed = true;
  }

  browsePage(p) {
    const _self = this;
    const keys = _self.state.keys
    const index = Math.min(p, keys.length)
    const lastKey = keys[index - 1]
    API.getAllHooks({ lastKey, limit: pageSize }, (res) => {
      if (res.lastKey) {
        keys[index] = res.lastKey;
      }
      _self.setState({ hooks: res.hooks, keys, page: p });
    });
  }

  deleteHook(id) {
    if (!window.confirm(`Are you sure to delete hook of id ${id} ?`)) {
      return;
    }

    const _self = this;
    API.deleteHook(id, () => {
      const { page, keys } = _self.state
      const sliceKeys = keys.slice(0, page)
      _self.setState({ keys: sliceKeys })
      _self.browsePage(page);
    });
  }

  confirmHook(id) {
    const _self = this;
    const ld = _.clone(_self.state.loading);
    ld[id] = true;
    _self.setState({ loading: ld });

    API.confirmHook(id, (result) => {
      if (_self.destroyed) {
        return;
      }

      const ld2 = _.clone(_self.state.loading);
      ld2[id] = false;

      const hks = _.clone(_self.state.hooks);
      const hk = _.find(hks, (hook) => hook.id === id);
      if (hk) {
        hk.confirmed = result.confirmed;
      }

      _self.setState({ loading: ld2, hooks: hks });
    });
  }

  render() {
    const { hooks, page, keys, selectedFilter, loading } = this.state;
    let pageCount = keys.length;
    if (pageCount < 1) pageCount = 1;
    const pages = [];
    for (let i = 1; i <= pageCount; i += 1) pages.push(i);
    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <h5 className="is-size-5 has-text-grey-light">Your registered resthooks</h5>
          </div>
        </div>
        <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead className="thead">
            <tr>
              <th className="has-text-centered">ID</th>
              <th className="has-text-centered">NAME</th>
              <th className="has-text-centered">DESCRIPTION</th>
              {this.props.currentUser.isAdmin && (
                <th className="has-text-centered">OWNER</th>
              )}
              <th className="has-text-centered">TOPIC</th>
              <th className="has-text-centered">ENDPOINT</th>
              <th className="has-text-centered">RULE</th>
              <th className="has-text-centered">CREATED AT</th>
              <th className="has-text-centered">UPDATED AT</th>
              <th className="has-text-centered">CONFIRMED</th>
              <th className="has-text-centered">ACTION</th>
            </tr>
          </thead>
          <tbody className="tbody">
            { hooks.map((hook, index) => (
              <tr key={hook.id}>
                <td className="has-text-centered">{this.props.currentUser.isAdmin ? hook.id : (pageSize * (page - 1) + index + 1)}</td>
                <td className="has-text-centered">{hook.name}</td>
                <td className="has-text-centered">{hook.description}</td>
                {this.props.currentUser.isAdmin && (
                  <td className="has-text-centered">{hook.owner}</td>
                )}
                <td><span className="tag is-dark">{hook.topic}</span></td>
                <td className="word-break">{hook.endpoint}</td>
                <td>
                  <div className="control has-text-centered">
                    {hook.filter && hook.filter.trim() && (
                      <a
                        className="button"
                        onClick={() => { this.setState({ selectedFilter: hook.filter }) }}
                      >
                        <img width="18" height="16" src={IconView}  alt="Icon View" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="has-text-centered">{moment(hook.createdAt).format('Do MMM, YYYY')}</td>
                <td className="has-text-centered">{moment(hook.updatedAt).format('Do MMM, YYYY')}</td>
                <td className="control has-text-centered">
                  {hook.confirmed && !loading[hook.id] && (
                    <span className="has-text-primary">Yes</span>
                  )}
                  {!hook.confirmed && !loading[hook.id] && (
                    <div>
                      <span className="has-text-danger">No</span>&nbsp;
                      <a
                        className="button is-small is-text reload-button"
                        onClick={() => this.confirmHook(hook.id)}
                      >Try again</a>
                    </div>
                  )}
                  { loading[hook.id] && (
                    <span>Loading...</span>
                  )}
                </td>
                <td className="has-text-centered">
                  <Popup trigger={<a className="button">
                      <img
                        width="18"
                        height="16"
                        src={IconDots}
                        className="svg svg-inline--fa"
                        alt="Icon Dots"
                      />
                    </a>}>
                    <div className="buttons">
                      <a
                        onClick={() => { this.props.history.push('/updatehook/' + hook.id) }}
                        className="button is-link"
                      >
                        <img
                          width="18"
                          height="16"
                          src={IconEdit}
                          className="svg svg-inline--fa fa-edit fa-w-18"
                          alt="Icon Edit"
                        />
                      </a>
                      <a
                        onClick={() => this.deleteHook(hook.id)}
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
                      <a
                        className="button is-primary is-link reload-button"
                        onClick={() => { this.props.history.push('/hookhistories/' + hook.id) }}
                      >History</a>
                    </div>
                  </Popup>
                </td>
              </tr>
            )) }

          </tbody>
        </table>
        <nav
          className={`${styles.pagination} pagination`}
          aria-label="pagination"
        >
          <a
            className="pagination-previous"
            title="This is the first page"
            onClick={() => (((page - 1) >= 1) && this.browsePage(page - 1))}
            disabled={((page - 1) < 1)}
          >Previous</a>
          <a
            className="pagination-next"
            onClick={() => (((page + 1) <= pages.length) && this.browsePage(page + 1))}
            disabled={((page + 1) > pages.length)}
          >Next page</a>
          <ul className="pagination-list">
            { pages.map((p) => (
                p === page ? (
                    <li key={`current-page${p}`}>
                      <a className="pagination-link is-current" aria-label={`Page ${p}`} aria-current="page">{p}</a>
                    </li>
                  ) : (
                    <li key={`page${p}`}>
                      <a onClick={() => this.browsePage(p)} className="pagination-link" aria-label={`Goto page ${p}`}>{p}</a>
                    </li>
                  )
              )) }
          </ul>
        </nav>
        <div className="buttons">
          <a
            className="button pull-right is-primary"
            onClick={() => { this.props.history.push('/addhook') }}
          >Add new resthook</a>
          { this.props.currentUser.isAdmin && (
              <a
                className="button pull-right is-primary"
                onClick={() => { this.props.history.push('/roletopics') }}
              >Manage role topics</a>
            ) }
        </div>

        <div className={`modal ${selectedFilter ? 'is-active' : ''}`} id="rule-modal">
          <div className="modal-background"></div>
          <div className="modal-content">
            <pre>{selectedFilter}</pre>
          </div>
          <button
            className="modal-close is-large rule-close"
            aria-label="close"
            onClick={() => { this.setState({ selectedFilter: '' }) }}
          ></button>
        </div>
      </div>
    );
  }
}

export default RestHooks;
