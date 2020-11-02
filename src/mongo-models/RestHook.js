/**
 * This defines Rest Hook model.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  topic: { type: String, required: true },
  endpoint: { type: String, required: true },
  handle: { type: String, require: true },
  filter: String
}, {
  timestamps: true
});

schema.index({ topic: 1 });
schema.index({ topic: 1, endpoint: 1 }, { unique: true });

module.exports = schema;
