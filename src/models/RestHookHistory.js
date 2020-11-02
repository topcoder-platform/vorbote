/**
 * This defines RestHookHistory model.
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
  hookId: {
    type: String,
    required: true
  },
  // requestData object is stored as JSON string
  requestData: {
    type: String,
    required: false
  },
  responseStatus: {
    type: Number,
    required: true
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
