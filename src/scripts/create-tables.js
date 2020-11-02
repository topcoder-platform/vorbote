/**
 * Create table schemes in database
 */

require('../bootstrap');
const co = require('co')
const models = require('../models');
const logger = require('../common/logger');
const dynamoose = require('dynamoose')

logger.info('Requesting to create tables')

function * createTables() {
  const ddb = dynamoose.aws.ddb()
  for (const model of Object.values(models)) {
    const modelTableParams = yield model.table.create.request()
    yield ddb.createTable(modelTableParams).promise()
  }
}

co(function * main() {
  yield createTables()
  logger.info('Table creation completed. Verify using Dynamodb UI')
  process.exit()
}).catch((err) => {
  logger.logFullError(err)
  process.exit(1)
})
