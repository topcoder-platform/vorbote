/**
 * Initialize and exports all models.
 */
'use strict';

const fs = require('fs');
const config = require('config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise || require('bluebird');
const conn = mongoose.createConnection(config.MONGODB_URI);
const models = {};

// Bootstrap models
fs.readdirSync(__dirname).forEach((file) => {
  if (file !== 'index.js') {
    const filename = file.split('.')[0];
    const schema = require(__dirname + '/' + filename);
    const model = conn.model(filename, schema);
    models[filename] = model;

    model.schema.options.minimize = false;
    model.schema.options.toJSON = {
      transform: (doc, ret) => {
        if (ret._id) {
          ret.id = String(ret._id);
          delete ret._id;
        }
        delete ret.__v;
        return ret;
      },
    };
  }
});

module.exports = models;
