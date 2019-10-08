import React, { Component } from 'react';
import moment from 'moment';
import IconCheck from './assets/images/icon-check.svg';
import IconCross from './assets/images/icon-cross.svg';
import API from './services/API';

class RestHookHistories extends Component {
  constructor() {
    super();
    this.state = {
      items: [],
    };
  }

  componentDidMount() {
    const _self = this;
    API.getHookHistories(this.props.match.params.id, (items) => {
      _self.setState({ items });
    });
  }

  render() {
    const { items } = this.state;

    return (
      <div className="container">
        <div className="columns">
          <div className="column">
            <h5 className="is-size-5 has-text-grey-light">REST hook histories</h5>
          </div>
        </div>
        <table className="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead className="thead">
            <tr>
              <th className="has-text-centered">ID</th>
              <th className="has-text-centered">TIME</th>
              <th className="has-text-centered">REQUEST DATA</th>
              <th className="has-text-centered">RESPONSE STATUS</th>
              <th className="has-text-centered">SUCCESS</th>
            </tr>
          </thead>
          <tbody className="tbody">
            { items.map((item) => (
              <tr key={item.id}>
                <td className="has-text-centered">{item.id}</td>
                <td className="has-text-centered">{moment(item.createdAt).format('Do MMM, YYYY')}</td>
                <td className="has-text-centered">{JSON.stringify(item.requestData || {})}</td>
                <td className="has-text-centered">{item.responseStatus}</td>
                <td className="has-text-centered">
                  {item.responseStatus >= 200 && item.responseStatus < 300 && (
                    <span className="tag is-primary">
                      <img
                        width="18"
                        height="16"
                        src={IconCheck}
                        className="svg svg-inline--fa"
                        alt="Icon Check"
                      />
                    </span>
                  )}
                  {(item.responseStatus < 200 || item.responseStatus >= 300) && (
                    <span className="tag is-danger">
                      <img
                        width="18"
                        height="16"
                        src={IconCross}
                        className="svg svg-inline--fa"
                        alt="Icon Check"
                      />
                    </span>
                  )}
                </td>
              </tr>
            )) }

          </tbody>
        </table>

        <div className="buttons">
          <a
            className="button pull-right is-light"
            onClick={() => { this.props.history.push('/') }}
          >Back to Resthooks</a>
        </div>
      </div>
    );
  }
}

export default RestHookHistories;
