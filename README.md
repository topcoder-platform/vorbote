# Topcoder Event RestHooks

## Dependencies

- Nodejs (version 8+)
- MongoDB 3.4
- DynamoDB (https://aws.amazon.com/dynamodb/)
- Docker (https://www.docker.com/)
- Docker Compose (https://docs.docker.com/compose/)

## Configuration

Configuration for the notification server is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: the server port
- MONGODB_URI: the Mongo DB URI
- DYNAMODB.AWS_ACCESS_KEY_ID: The Amazon certificate key to use when connecting. Use local dynamodb you can set fake value
- DYNAMODB.AWS_SECRET_ACCESS_KEY: The Amazon certificate access key to use when connecting. Use local dynamodb you can set fake value
- DYNAMODB.AWS_REGION: The Amazon certificate region to use when connecting. Use local dynamodb you can set fake value
- DYNAMODB.IS_LOCAL: Use Amazon DynamoDB Local or server.
- DYNAMODB.URL: The local url if using Amazon DynamoDB Local
- DYNAMODB.AWS_READ_UNITS: The DynamoDB table read unit configuration, default is 4
- DYNAMODB.AWS_WRITE_UNITS: The DynamoDB table write unit configuration, default is 2
- TC_ADMIN_ROLE: TC admin role identifier
- REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE: refresh Kafka consumer period in minutes
- RESTHOOK_FILTER_MAX_LENGTH: the max length for REST hook filter code
- KAFKA_URL: comma separated Kafka hosts
- KAFKA_CLIENT_CERT: Kafka connection certificate, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to certificate file or certificate content
- KAFKA_CLIENT_CERT_KEY: Kafka connection private key, optional;
    if not provided, then SSL connection is not used, direct insecure connection is used;
    if provided, it can be either path to private key file or private key content
- AXIOS_TIMEOUT: axios timeout in milliseconds
- HOOK_HISTORY_COUNT: hook history max count

## Local Kafka setup

- `http://kafka.apache.org/quickstart` contains details to setup and manage Kafka server,
  below provides details to setup Kafka server in Mac, Windows will use bat commands in bin/windows instead
- download kafka at `https://www.apache.org/dyn/closer.cgi?path=/kafka/1.1.0/kafka_2.11-1.1.0.tgz`
- extract out the downloaded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create some topics:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.create`
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic topic1`
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic topic2`
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic topic3`
- verify that the topic is created:
  `bin/kafka-topics.sh --list --zookeeper localhost:2181`,
  it should list out the created topics
- run the producer and then type a few messages into the console to send to the server:
  `bin/kafka-console-producer.sh --broker-list localhost:9092 --topic challenge.notification.create`
  in the console, write some messages, one per line:
  `{ "originator": "ap-challenge-api", "mime-type": "application/json", "payload": { "challenge": { "id": 123 } } }`
  `{ "originator": "ap-challenge-api", "mime-type": "application/json", "payload": { "challenge": { "id": 456 } } }`
  we can keep this producer so that we may send more messages later for verification
- use another terminal, go to same directory, start a consumer to view the messages:
  `bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic challenge.notification.create --from-beginning`

## Front end UI setup

- the front end UI's build folder content are exposed as public content by the REST Hook app, so you may directly access it
  via `http://localhost:3000`
- note that if the front end UI's API_URL config is changed, it must be re-built using `npm run build` in the ui folder

## DynamoDB Setup

We can use DynamoDB setup on Docker for testing purpose. Just run `docker-compose up` in `local` folder.

## Scripts
- Create DynamoDB tables: `npm run create-tables`
- Initialize DynamoDB database, it will clear all data: `npm run init-db`
- Migrate data from MongoDB to DynamoDB: `npm run migrate-data`

## Local deployment

- In order to deploy locally, your port must be 3000. This is because we use topcoder's authentication service, which will only recognize localhost:3000 as a valid host
- setup Kafka as above
- start local DynamoDB
- install dependencies `npm i`
- run code lint check `npm run lint`
- create DynamoDB tables: `npm run create-tables`
- run test `npm run test`, note that this will clear all data
- start REST Hook app `npm start`,
  the app is running at `http://localhost:3000`,
  it also starts Kafka consumer to listen for events and send to registered corresponding hooks,
  due to TC authentication, you need to browse `http://localhost:3000`
- use another terminal to start sample client `npm run client`
  the sample client is running at `http://localhost:5555`,
  this client is needed for UI verification, but not needed for unit tests, because unit tests use nock to mock the callback APIs

## UI Verification

- setup stuff following above deployment
- you don't need to start another front end app, the front end ui is built and exposed as public content by back end app
- for UI testing, you need to browse `http://localhost:3000`, and you may login with credentials:
  (admin) tonyj / appirio123
  (copilot) callmekatootie / appirio123
- use the UI (login as admin) to add a hook,
  name can be any non-empty string,
  description is optional,
  topic is `challenge.notification.create`,
  endpoint is `http://localhost:5555/callback`,
  filter is a JavaScript code that can reference `message` object,
  e.g. `message.originator == 'ap-challenge-api' && message['mime-type'] == 'application/json' || 2 + 3 < 4`
- use the kafka-console-producer to generate some messages in Kafka, see above for `Local Kafka setup` section
  for sample messages, then watch the sample client console, it should got some messages
- you may send more than 10 messages to the hook, view its history, only the last 10 history records are kept
- after a hook is confirmed, you may stop the sample client, then send message, then a failed hook call history can be generated
- update the hook's filter code to `message.originator == 'not-found'`,
  use the kafka-console-producer to generate messages in Kafka again,
  then watch the sample client console, it should got NO new messages because the filter is evaluated to false
- you may create and test hooks with endpoints `http://localhost:5555/callback-unconfirmed`, `http://localhost:5555/callback-late`
  and `http://localhost:5555/callback-random` (it will get confirmed or not confirmed in random, so you may create multiple hooks
  with this random callback, there are different behaviours)

- login as admin, there is `Manage Role Topics` button for admin, click it to manage role topics
- try create/delete some role topics, create more than 10 records to test the pagination functionalities
- create a role topic record, role: copilot, topic: challenge.notification.create, so that copilot can use topic challenge.notification.create
- logout and login as copilot, note that you may need to use another browser to login as copilot, because TC auth remembers the previous admin login via browser cookie, after login, if the TC login doesn't redirect you to `http://localhost:3000`, then you may browse `http://localhost:3000` again
- after copilot login, you can see that there is no `Manage Role Topics` button, and copilot can not
  see admin's rest hooks
- create/update some rest hooks, you can see copilot can only use topic `challenge.notification.create` which is setup by admin
- for the functionalities to detect new topic, I don't see no-kafka has API to directly detect new topic, so it uses another approach, it will refresh the Kafka consumer periodically, when consumer is refreshed, all new topics are detected. To test this functionality, update back end REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE config param to 1, so that consumer will be refreshed every minute. Then start the app, login as admin, see the topics; create a new topic in Kafka, wait for more than 1 minute, use the UI to view the topics again, new topic can be seen.

- the sample client supports only HTTP, but not HTTPS, so above verification allows HTTP endpoint hooks, to test HTTPS endpoint validation, do below:
  in the root folder, update `set-env.js` config `REQUIRE_HTTPS_HOOK` default value to `'true'`,
  run `npm i`, this will update UI config and re-build UI distribution,
  run `npm start`, then verify HTTPS validation in add/update hook pages.
  You may use any HTTPS endpoint, it won't be confirmed, and thus won't get called, but you can still add/update the hook.
