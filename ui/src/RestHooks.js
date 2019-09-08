import React, { Component } from 'react';
import moment from 'moment';
import styles from './RestHooks.css';
import API from './services/API';
import config from './config/config';
import IconEdit from './assets/images/icon-edit.svg';
import IconDelete from './assets/images/icon-delete.svg';
import IconView from './assets/images/icon-view.svg';

const pageSize = Number(config.PAGE_SIZE);

class RestHooks extends Component {
  constructor() {
    super();
    this.state = {
      hooks: [],
      page: 1,
      total: 0,
      selectedFilter: '',
    };
    this.deleteHook = this.deleteHook.bind(this);
    this.browsePage = this.browsePage.bind(this);
  }

  componentDidMount() {
    this.browsePage(1);
  }

  browsePage(p) {
    const _self = this;
    API.getAllHooks({ offset: (p - 1) * pageSize, limit: pageSize }, (res) => {
      _self.setState({ hooks: res.hooks, total: res.total, page: p });
    });
  }

  deleteHook(id) {
    const _self = this;
    API.deleteHook(id, () => {
      _self.browsePage(_self.state.page);
    });
  }

  render() {
    const { hooks, page, total, selectedFilter } = this.state;
    let pageCount = Math.ceil(total / pageSize);
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
              <th className="has-text-centered">TOPIC</th>
              <th className="has-text-centered">ENDPOINT</th>
              <th className="has-text-centered">RULE</th>
              <th className="has-text-centered">CREATED AT</th>
              <th className="has-text-centered">UPDATED AT</th>
              <th className="has-text-centered">ACTION</th>
            </tr>
          </thead>
          <tbody className="tbody">
            { hooks.map((hook, index) => (
              <tr key={hook.id}>
                <td className="has-text-centered">{this.props.currentUser.isAdmin ? hook.id : (pageSize * (page - 1) + index + 1)}</td>
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
                <td className={styles['table-actions-column']}>
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
                  </div>
                </td>
              </tr>
            )) }

          </tbody>
        </table>
        <nav
          className={`${styles.pagination} pagination`}
          role="navigation"
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
                    <li>
                      <a key={p} className="pagination-link is-current" aria-label={`Page ${p}`} aria-current="page">{p}</a>
                    </li>
                  ) : (
                    <li>
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
