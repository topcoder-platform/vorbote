/**
 * Initialize and export all DynamoDB model schemas.
 */

const config = require('config');
const dynamoose = require('dynamoose');
const fs = require('fs')
const path = require('path')

dynamoose.aws.sdk.config.update({
  accessKeyId: config.DYNAMODB.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.DYNAMODB.AWS_SECRET_ACCESS_KEY,
  region: config.DYNAMODB.AWS_REGION
});

if (config.DYNAMODB.IS_LOCAL) {
  dynamoose.aws.ddb.local(config.DYNAMODB.URL);
}

dynamoose.model.defaults.set({
  create: false,
  update: false,
  waitForActive: false
})

const models = {}
fs.readdirSync(__dirname).forEach((file) => {
  if (file !== 'index.js') {
    const filename = file.split('.')[0]
    const schema = require(path.join(__dirname, filename))
    const model = dynamoose.model(`webhook_${filename}`, schema)
    models[filename] = model
  }
})

module.exports = models
