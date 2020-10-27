/**
 * This defines Rest Hook History model.
 */
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const schema = new Schema({
  hookId: { type: ObjectId, ref: 'RestHook', required: true },
  requestData: Object,
  responseStatus: { type: Number, required: true }
}, {
  timestamps: true
});

schema.index({ hookId: 1 });

module.exports = schema;
