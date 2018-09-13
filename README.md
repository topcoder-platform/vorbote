# Topcoder Event RestHooks

## Dependencies

- Nodejs (version 8+)
- MongoDB 3.4

## Configuration

Configuration for the notification server is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: the server port
- MONGODB_URI: the Mongo DB URI
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
  via http://localhost:3000
- note that if the front end UI's API_URL config is changed, it must be re-built using `npm run build` in the ui folder

## Local deployment

- In order to deploy locally, your port must be 3000. This is because we use topcoder's authentication service, which will only recognize localhost:3000 as a valid host
- setup Kafka as above
- start local Mongo db, update the config/default.js MONGODB_URI param to point to a new db
- install dependencies `npm i`
- run code lint check `npm run lint`
- run test `npm run test`
- start REST Hook app `npm start`,
  the app is running at `http://localhost:3000`,
  it also starts Kafka consumer to listen for events and send to registered corresponding hooks,
  due to TC authentication, you need to browse `http://localhost:3000`
- use another terminal to start sample client `npm run client`
  the sample client is running at `http://localhost:5000`

## Verification

- setup stuff following above deployment
- use the Postman collection and environment in docs folder to test the APIs
- you don't need to start another front end app, the front end ui is built and exposed as public content by back end app
- for UI testing, you need to browse `http://localhost:3000`, and you may login with credentials:
  (admin) suser1 / Topcoder123
  (copilot) mess / appirio123
- use the UI (login as admin) or Postman to add a hook,
  topic is `challenge.notification.create`,
  endpoint is `http://localhost:5000/callback`,
  filter is a JavaScript code that can reference `message` object,
  e.g. `message.originator == 'ap-challenge-api' && message['mime-type'] == 'application/json' || 2 + 3 < 4`
- use the kafka-console-producer to generate some messages in Kafka, see above for `Local Kafka setup` section
  for sample messages, then watch the sample client console, it should got some messages
- update the hook's filter code to `message.originator == 'not-found'`,
  use the kafka-console-producer to generate messages in Kafka again,
  then watch the sample client console, it should got NO new messages because the filter is evaluated to false
- login as admin, there is `Manage Role Topics` button for admin, click it to manage role topics
- try create/delete some role topics, create more than 10 records to test the pagination functionalities
- create a role topic record, role: copilot, topic: challenge.notification.create, so that copilot can use topic challenge.notification.create
- logout and login as copilot, note that you may need to use another browser to login as copilot, because TC auth remembers the previous admin login via browser cookie, after login, if the TC login doesn't redirect you to `http://localhost:3000`, then you may browse `http://localhost:3000` again
- after copilot login, you can see that there is no `Manage Role Topics` button, and copilot can not
  see admin's rest hooks
- create/update some rest hooks, you can see copilot can only use topic `challenge.notification.create` which is setup by admin
- for the functionalities to detect new topic, I don't see no-kafka has API to directly detect new topic, so it uses another approach, it will refresh the Kafka consumer periodically, when consumer is refreshed, all new topics are detected. To test this functionality, update back end REFRESH_KAFKA_CONSUMER_PERIOD_MINUTE config param to 1, so that consumer will be refreshed every minute. Then start the app, login as admin, see the topics; create a new topic in Kafka, wait for more than 1 minute, use the UI to view the topics again, new topic can be seen.
