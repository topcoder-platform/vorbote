/**
 * This defines Rest Hook model.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  name: { type: String, required: true },
  description: String,
  topic: { type: String, required: true },
  endpoint: { type: String, required: true },
  owner: { type: String, required: true },
  filter: String,
  confirmed: Boolean,
  headers: Object,
}, {
  timestamps: true,
});

schema.index({ topic: 1 });
schema.index({ topic: 1, endpoint: 1 }, { unique: true });

module.exports = schema;
