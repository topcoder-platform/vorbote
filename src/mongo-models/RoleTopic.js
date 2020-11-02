/**
 * This defines Role Topic model.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
  role: { type: String, required: true },
  topic: { type: String, required: true }
}, {
  timestamps: true
});

schema.index({ role: 1 });
schema.index({ role: 1, topic: 1 }, { unique: true });

module.exports = schema;
