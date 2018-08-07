# Topcoder Event RestHooks

## Dependencies
- nodejs https://nodejs.org/en/ (v8+)
- MongoDB 3.4


## Configuration
Configuration for the notification server is at `config/default.js`.
The following parameters can be set in config files or in env variables:
- LOG_LEVEL: the log level
- PORT: the server port
- MONGODB_URI: the Mongo DB URI
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
- extract out the doanlowded tgz file
- go to extracted directory kafka_2.11-0.11.0.1
- start ZooKeeper server:
  `bin/zookeeper-server-start.sh config/zookeeper.properties`
- use another terminal, go to same directory, start the Kafka server:
  `bin/kafka-server-start.sh config/server.properties`
- note that the zookeeper server is at localhost:2181, and Kafka server is at localhost:9092
- use another terminal, go to same directory, create a topic:
  `bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic challenge.notification.create`
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
- setup Kafka as above
- start local Mongo db, update the config/default.js MONGODB_URI param to point to a new db
- install dependencies `npm i`
- run code lint check `npm run lint`
- run test `npm run test`
- start REST Hook app `npm start`,
  the app is running at `http://localhost:3000`,
  it also starts Kafka consumer to listen for events and send to registered corresponding hooks
- use another terminal to start sample client `npm run client`
  the sample client is running at `http://localhost:5000`



## Verification

- setup stuff following above deployment
- use the Postman collection and environment in docs folder to test the APIs
- use the UI or Postman to add a hook,
  topic is `challenge.notification.create`,
  endpoint is `http://localhost:5000/callback`,
  filter is a JavaScript code that can reference `message` object,
  e.g. `message.originator == 'ap-challenge-api' && message['mime-type'] == 'application/json' || 2 + 3 < 4`
- use the kafka-console-producer to generate some messages in Kafka, see above for `Local Kafka setup` section
  for sample messages, then watch the sample client console, it should got some messages
- update the hook's filter code to `message.originator == 'not-found'`,
  use the kafka-console-producer to generate messages in Kafka again,
  then watch the sample client console, it should got NO new messages because the filter is evaluated to false

