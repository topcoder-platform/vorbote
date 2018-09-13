/**
 * The configuration file.
 */
module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/resthook',
  RESTHOOK_FILTER_MAX_LENGTH: process.env.RESTHOOK_FILTER_MAX_LENGTH || 1000,
  TC_ADMIN_ROLE: process.env.TC_ADMIN_ROLE || 'administrator',
  REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE: process.env.REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE || 1,

  KAFKA_URL: process.env.KAFKA_URL || 'localhost:9092',
  // below are used for secure Kafka connection, they are optional
  // for the local Kafka, they are not needed
  KAFKA_CLIENT_CERT: process.env.KAFKA_CLIENT_CERT,
  KAFKA_CLIENT_CERT_KEY: process.env.KAFKA_CLIENT_CERT_KEY,
};
