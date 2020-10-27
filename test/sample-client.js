/**
 * The application entry point
 */
'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('../src/common/logger');

const app = express();
app.set('port', process.env.CLIENT_PORT || 5555);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/callback', (req, res) => {
  if (req.headers['x-hook-secret']) {
    logger.info(`Confirm hook with secret: ${req.headers['x-hook-secret']}`);
    res.send({ 'x-hook-secret': req.headers['x-hook-secret'] });
    return;
  }
  logger.info('Sample client got headers:');
  logger.info(JSON.stringify(req.headers, null, 4));
  logger.info('Sample client got callback data:');
  logger.info(JSON.stringify(req.body, null, 4));
  res.end();
});

app.post('/callback-random', (req, res) => {
  if (req.headers['x-hook-secret']) {
    const secret = Math.random() > 0.5 ? req.headers['x-hook-secret'] : 'wrong';
    logger.info(`Confirm hook response with secret: ${secret}`);
    setTimeout(() => res.send({ 'x-hook-secret': secret }), 3000);
    return;
  }
  logger.info('Sample client got headers:');
  logger.info(JSON.stringify(req.headers, null, 4));
  logger.info('Sample client got callback data:');
  logger.info(JSON.stringify(req.body, null, 4));
  res.end();
});

app.post('/callback-unconfirmed', (req, res) => {
  logger.info('Calling: /callback-unconfirmed');
  res.end();
});

app.post('/callback-late', (req, res) => {
  logger.info('Calling: /callback-late');
  setTimeout(() => res.end(), 15000);
});

app.use((req, res) => {
  res.status(404).json({ error: 'route not found' });
});

app.use((err, req, res, next) => { // eslint-disable-line
  logger.logFullError(err);
  res.status(500).json({
    error: err.message
  });
});

app.listen(app.get('port'), () => {
  logger.info(`Express server listening on port ${app.get('port')}`);
});
