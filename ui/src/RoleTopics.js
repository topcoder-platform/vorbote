import React, { Component } from 'react';
import moment from 'moment';

import styles from './RoleTopics.css';
import API from './services/API';
import config from './config/config';
import IconDelete from './assets/images/icon-delete.svg';

const pageSize = Number(config.PAGE_SIZE);

class RoleTopics extends Component {
  constructor() {
    super();
    this.state = {
      items: [],
      page: 1,
      keys: [undefined],
    };
    this.deleteRoleTopic = this.deleteRoleTopic.bind(this);
    this.browsePage = this.browsePage.bind(this);
  }

  componentDidMount() {
    this.browsePage(1);
  }

  browsePage(p) {
    const _self = this;
    const keys = _self.state.keys
    const index = Math.min(p, keys.length)
    const lastKey = keys[index - 1]
    API.getRoleTopics({ lastKey, limit: pageSize }, (res) => {
      if (res.lastKey) {
        keys[index] = res.lastKey;
      }
      _self.setState({ items: res.roleTopics, keys, page: p });
    });
  }

  deleteRoleTopic(id) {
    if (!window.confirm(`Are you sure to delete role topic of id ${id} ?`)) {
      return;
    }

    const _self = this;
    API.deleteRoleTopic(id, () => {
      const { page, keys } = _self.state
      const sliceKeys = keys.slice(0, page)
      _self.setState({ keys: sliceKeys })
      _self.browsePage(page);
    });
  }

  render() {
    if (!this.props.currentUser.isAdmin) return null;

    const { items, page, keys } = this.state;
    let pageCount = keys.length;
    if (pageCount < 1) pageCount = 1;
    const pages = [];
    for (let i = 1; i <= pageCount; i += 1) pages.push(i);

    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <h5 className="is-size-5 has-text-grey-light">Manage role topics</h5>
          </div>
        </div>
        <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead className="thead">
            <tr>
              <th className="has-text-centered">ID</th>
              <th className="has-text-centered">ROLE</th>
              <th className="has-text-centered">TOPIC</th>
              <th className="has-text-centered">CREATED AT</th>
              <th className="has-text-centered">ACTION</th>
            </tr>
          </thead>
          <tbody className="tbody">
            { items.map((item) => (
              <tr key={item.id}>
                <td className="has-text-centered">{item.id}</td>
                <td className="has-text-centered word-break">{item.role}</td>
                <td><span className="tag is-dark">{item.topic}</span></td>
                <td className="has-text-centered">{moment(item.createdAt).format('Do MMM, YYYY')}</td>
                <td className="has-text-centered">
                  <a
                    onClick={() => this.deleteRoleTopic(item.id)}
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
            onClick={() => { this.props.history.push('/addroletopics') }}
          >Add</a>
          <a
            className="button pull-right is-light"
            onClick={() => { this.props.history.push('/') }}
          >Back to Resthooks</a>
        </div>
      </div>
    );
  }
}

export default RoleTopics;
