import { expect } from "chai";
import "mocha";

import { buildPublisher, DEFAULT_PRODUCER_GLOBAL_CONFIGURATION,
    DEFAULT_PRODUCER_TOPIC_CONFIGURATION, defaultProducerConfigBuilder,
    IProducerConfiguration} from "./kafka";

describe("IProducerConfiguration", () => {
    it("should return the correct configuration object based " +
        "upon the default builder", () => {
        const config: IProducerConfiguration =
            defaultProducerConfigBuilder("kafka+ssl:9092,kafka+ssl:9099",
                "test.producer");
        expect(config).to.deep.equal({
            globalConfig: {
                ...DEFAULT_PRODUCER_GLOBAL_CONFIGURATION,
                "client.id": "test.producer",
                "log.connection.close": true,
                "log_level": 7,
                "metadata.broker.list": "ssl:9092,ssl:9099",
                "reconnect.backoff.jitter.ms": 1000,
                "statistics.interval.ms": 5000,
            },
            topicConfig: DEFAULT_PRODUCER_TOPIC_CONFIGURATION,
        });
    });

    it("should return the correct configuration" +
        " object based upon a custom builder", () => {

        const customGlobalConfig = {
            "socket.max.fails": 1,
            "socket.timeout.ms": 60000,
        };

        const customTopicConfig = {
            "message.timeout.ms": 10000,
            "request.required.acks": -1,
            "request.timeout.ms": 10000,
        };

        const config: IProducerConfiguration =
            defaultProducerConfigBuilder("kafka+ssl:9092,kafka+ssl:9099",
                "test.producer", customGlobalConfig, customTopicConfig);
        expect(config).to.deep.equal({
            globalConfig: {
                "client.id": "test.producer",
                "dr_cb": true,
                "dr_msg_cb": true,
                "event_cb": true,
                "log.connection.close": true,
                "log_level": 7,
                "metadata.broker.list": "ssl:9092,ssl:9099",
                "reconnect.backoff.jitter.ms": 1000,
                "socket.max.fails": 1,
                "socket.timeout.ms": 60000,
                "statistics.interval.ms": 5000,
            },
            topicConfig: {
                "message.timeout.ms": 10000,
                "request.required.acks": -1,
                "request.timeout.ms": 10000,
            },
        });
    });
});

describe("Producer", () => {
    it("should be given a broker list and clientId" +
        " and return an initialized producer", (done) => {
        expect(
            buildPublisher("kafka:9092", "test.producer"),
        ).to.not.equal(null);
        done();
    });
});

import {  buildSubscriber, DEFAULT_CONSUMER_GLOBAL_CONFIGURATION,
    DEFAULT_CONSUMER_TOPIC_CONFIGURATION, defaultConsumerConfigBuilder,
    IConsumerConfiguration} from "./kafka";

describe("IConsumerConfiguration", () => {
   it("should return the correct configuration" +
       " object based upon the default builder", (done) => {
       const config: IConsumerConfiguration = defaultConsumerConfigBuilder(
           "kafka:9092", "test.client", "test.group");
       expect(config).to.deep.equal({
           commitMessageCount: 0,
           globalConfig: {
               ...DEFAULT_CONSUMER_GLOBAL_CONFIGURATION,
               "client.id": "test.client",
               "group.id": "test.group",
               "metadata.broker.list": "kafka:9092",
           },
           topicConfig: DEFAULT_CONSUMER_TOPIC_CONFIGURATION,
       });
       done();
   });

   it("should return the correct configuration " +
       "object based upon a custom builder", (done) => {

       const customGlobalConfig = {
           "socket.max.fails": 1,
           "socket.timeout.ms": 60000,
       };

       const customTopicConfig = {
           "message.timeout.ms": 10000,
           "request.required.acks": -1,
           "request.timeout.ms": 10000,
       };

       const config: IConsumerConfiguration = defaultConsumerConfigBuilder(
           "kafka:9092", "test.client", "test.group",
           customGlobalConfig, customTopicConfig);
       expect(config).to.deep.equal({
           commitMessageCount: 0,
           globalConfig: {
               "client.id": "test.client",
               "enable.auto.commit": true,
               "event_cb": true,
               "group.id": "test.group",
               "heartbeat.interval.ms": 10000,
               "log.connection.close": true,
               "log_level": 7,
               "metadata.broker.list": "kafka:9092",
               "offset_commit_cb": true,
               "rebalance_cb": true,
               "reconnect.backoff.jitter.ms": 1000,
               "session.timeout.ms": 30000,
               "socket.max.fails": 1,
               "socket.timeout.ms": 60000,
               "statistics.interval.ms": 5000,
           },
           topicConfig: {
               "message.timeout.ms": 10000,
               "request.required.acks": -1,
               "request.timeout.ms": 10000,
           },
       });
       done();
   });
});

describe("Consumer", () => {
    it("should be given a broker list, clientId and group id" +
        " and return an initialized consumer", (done) => {
        const consumer = buildSubscriber(
            "kafka:9092", "test.client",
            "test.group",
        );
        expect(consumer).to.not.equal(null);
        done();
    });
});
