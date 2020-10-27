/**
 * This defines RestHook model.
 */

const config = require('config');
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;

const schema = new Schema({
  id: {
    type: String,
    hashKey: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  filter: {
    type: String,
    required: false
  },
  confirmed: {
    type: Boolean,
    required: false
  },
  // headers object is stored as JSON string
  headers: {
    type: String,
    required: false
  },
  createdAt: {
    type: String,
    required: true
  },
  updatedAt: {
    type: String,
    required: false
  }
},
{
  throughput: { read: config.DYNAMODB.AWS_READ_UNITS, write: config.DYNAMODB.AWS_WRITE_UNITS }
});

module.exports = schema;
