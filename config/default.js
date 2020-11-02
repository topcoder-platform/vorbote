/**
 * The configuration file.
 */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/resthook',
  DYNAMODB: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    IS_LOCAL: process.env.IS_LOCAL_DB ? process.env.IS_LOCAL_DB === 'true' : false,
    URL: process.env.DYNAMODB_URL || 'http://localhost:7777',
    AWS_READ_UNITS: process.env.AWS_READ_UNITS || 4,
    AWS_WRITE_UNITS: process.env.AWS_WRITE_UNITS || 2
  },

  RESTHOOK_FILTER_MAX_LENGTH: process.env.RESTHOOK_FILTER_MAX_LENGTH || 1000,
  TC_ADMIN_ROLE: process.env.TC_ADMIN_ROLE || 'administrator',
  REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE: process.env.REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE || 1,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,
  // axios timeout in milliseconds
  AXIOS_TIMEOUT: process.env.AXIOS_TIMEOUT || 10000,
  HOOK_HISTORY_COUNT: process.env.HOOK_HISTORY_COUNT || 10
};
