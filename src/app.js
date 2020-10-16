/**
 * The application entry point
 */
'use strict';

require('./bootstrap');
const path = require('path');
const config = require('config');
const express = require('express');
const _ = require('lodash');
const cors = require('cors');
const bodyParser = require('body-parser');
const helper = require('./common/helper');
const logger = require('./common/logger');
const errors = require('./common/errors');
const Kafka = require('no-kafka');
const co = require('co');
const RestHookService = require('./services/RestHookService');
const decodeToken = require('@topcoder-platform/tc-auth-lib').decodeToken;

global.atob  = require('atob');

let currentConsumer = null;
let currentTopics = [];

/**
 * Start Kafka consumer.
 */
function startKafkaConsumer() {
  logger.info('Start Kafka consumer.');
  // create consumer
  const options = { connectionString: config.KAFKA_URL };
  if (config.KAFKA_CLIENT_CERT && config.KAFKA_CLIENT_CERT_KEY) {
    options.ssl = { cert: config.KAFKA_CLIENT_CERT, key: config.KAFKA_CLIENT_CERT_KEY };
  }
  const consumer = new Kafka.SimpleConsumer(options);

  // data handler
  const dataHandler = (messageSet, topic, partition) => Promise.each(messageSet, (m) => {
    const message = m.message.value.toString('utf8');
    logger.info(`Handle Kafka event message; Topic: ${topic}; Partition: ${partition}; Offset: ${
      m.offset}; Message: ${message}.`);
    const messageJSON = JSON.parse(message);
    if (!messageJSON.topic) {
      messageJSON.topic = topic;
    }
    if (!messageJSON.timestamp) {
      messageJSON.timestamp = new Date().toISOString();
    }
    return co(function*() {
      yield RestHookService.notifyHooks(messageJSON);
    })
      // commit offset
      .then(() => consumer.commitOffset({ topic, partition, offset: m.offset }))
      .catch((err) => logger.error(err));
  });

  const topics = [];
  consumer
    .init()
    // consume all topics
    .then(() => _.each(_.keys(consumer.client.topicMetadata), (tp) => {
      // ignore Kafka system topics
      if (!tp.startsWith('__')) {
        topics.push(tp);
        consumer.subscribe(tp, { time: Kafka.LATEST_OFFSET }, dataHandler);
      }
    }))
    // replace current consumer and topics
    .then(() => {
      if (currentConsumer) currentConsumer.end();
      currentConsumer = consumer;
      currentTopics = topics;
      currentTopics.sort();
    })
    .catch((err) => logger.error(err));
}

const app = express();
app.set('port', config.PORT);

// static content
app.use(express.static(path.join(__dirname, '../ui/build')));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiRouter = express.Router();

const authMiddleware = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new errors.UnauthorizedError('Authentication required.'));
  }
  try {
    req.user = decodeToken(token);
  } catch (err) {
    logger.error('Failed to decode JWT token.');
    logger.error(err);
    return next(new errors.UnauthorizedError('Authentication failed.'));
  }
  req.user.isAdmin = req.user.roles && _.indexOf(req.user.roles, config.TC_ADMIN_ROLE) >= 0;
  next();
};

// load all routes
_.each(require('./routes'), (verbs, url) => {
  _.each(verbs, (def, verb) => {
    const actions = [];
    const method = require('./controllers/' + def.controller)[def.method];
    if (!method) {
      throw new Error(def.method + ' is undefined');
    }
    actions.push((req, res, next) => {
      req.signature = `${def.controller}#${def.method}`;
      req.topics = currentTopics;
      next();
    });
    if (!def.public) {
      actions.push(authMiddleware);
      actions.push((req, res, next) => {
        if (!req.user || !req.user.handle || !req.user.roles || req.user.roles.length === 0) {
          return next(new errors.UnauthorizedError('Authentication failed.'));
        }
        next();
      });
      if (def.admin) {
        actions.push((req, res, next) => {
          if (!req.user.isAdmin) {
            return next(new errors.ForbiddenError('Only admin can access this API.'));
          }
          next();
        });
      }
    }
    actions.push(method);
    apiRouter[verb](url, helper.autoWrapExpress(actions));
  });
});

app.use('/api/v1', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

app.use((err, req, res, next) => { // eslint-disable-line
  logger.logFullError(err, req.signature);
  let status = err.httpStatus || 500;
  if (err.isJoi) {
    status = 400;
  }
  res.status(status);
  if (err.isJoi) {
    res.json({
      error: 'Validation failed',
      details: err.details,
    });
  } else {
    res.json({
      error: err.message,
    });
  }
});


if (!module.parent) {
  app.listen(app.get('port'), () => {
    logger.info(`Express server listening on port ${app.get('port')}`);
  });

  startKafkaConsumer();
  // refresh consumer periodically
  setInterval(startKafkaConsumer, Number(config.REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE) * 60000);
} else {
  module.exports = app;
}
