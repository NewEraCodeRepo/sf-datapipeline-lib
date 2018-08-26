import { expect } from "chai";
import "mocha";

import { statSync } from "fs";

import ProcessEnv = NodeJS.ProcessEnv;

import { IGlobalConfiguration } from "node-rdkafka";

import { addKafkaSSLSettings, hasKafkaSSLEnabled,
    ICertFileMap, toCertFiles, writeSSLFiles } from "./heroku";
import { defaultConsumerConfigBuilder, IConsumerConfiguration } from "./kafka";

describe("Heroku Kafka certs into Kafka config", () => {
    it("can determine Kafka SSL is configured", (done) => {
        const env: ProcessEnv = {
            KAFKA_CLIENT_CERT: "bar",
            KAFKA_CLIENT_CERT_KEY: "foo",
            KAFKA_TRUSTED_CERT: "baz",
        };
        expect(hasKafkaSSLEnabled(env)).to.be.eq(true);
        done();
    });
    it("can determine Kafka SSL is not configured", (done) => {
        const env: ProcessEnv = {};
        expect(hasKafkaSSLEnabled(env)).to.be.eq(false);
        done();
    });
    it("converts env vars into a Kafka config", (done) => {
       const env: ProcessEnv = {
           KAFKA_CLIENT_CERT: "bar",
           KAFKA_CLIENT_CERT_KEY: "foo",
           KAFKA_TRUSTED_CERT: "baz",
       };
       const map: ICertFileMap = toCertFiles(env, __dirname);
       expect(map).to.eql(
           {
               "client.key": {
                   contents: "foo",
                   path: __dirname + "/client.key",
               },
               "client.pem": {
                   contents: "bar",
                   path: __dirname + "/client.pem",
               },
               "server.pem": {
                   contents: "baz",
                   path: __dirname + "/server.pem",
               },
           },
       );
       done();
    });
    it("amends an IGlobalConfig based upon a ICertFileMap", (done) => {
       const env: ProcessEnv = {
           KAFKA_CLIENT_CERT: "bar",
           KAFKA_CLIENT_CERT_KEY: "foo",
           KAFKA_TRUSTED_CERT: "baz",
       };
       const map: ICertFileMap = toCertFiles(env, __dirname);
       const config: IConsumerConfiguration = defaultConsumerConfigBuilder(
           "0.0.0.0:9092", "test", "test.grp");
       const newConfig: IGlobalConfiguration = addKafkaSSLSettings(
           config.globalConfig, map);
       expect(newConfig).to.eql({
           "client.id": "test",
           "enable.auto.commit": true,
           "event_cb": true,
           "group.id": "test.grp",
           "heartbeat.interval.ms": 10000,
           "log.connection.close": true,
           "log_level": 7,
           "metadata.broker.list": "0.0.0.0:9092",
           "offset_commit_cb": true,
           "rebalance_cb": true,
           "reconnect.backoff.jitter.ms": 1000,
           "security.protocol": "ssl",
           "session.timeout.ms": 30000,
           "ssl.ca.location": __dirname + "/server.pem",
           "ssl.certificate.location": __dirname + "/client.pem",
           "ssl.key.location": __dirname + "/client.key",
           "statistics.interval.ms": 5000,
       });
       done();
    });
    it("should write files", (done) => {
       const env: ProcessEnv = {
           KAFKA_CLIENT_CERT: "bar",
           KAFKA_CLIENT_CERT_KEY: "foo",
           KAFKA_TRUSTED_CERT: "baz",
       };
       const map: ICertFileMap = toCertFiles(env, __dirname);
       writeSSLFiles(map);
       expect(statSync(__dirname + "/client.key").isFile());
       expect(statSync(__dirname + "/client.pem").isFile());
       expect(statSync(__dirname + "/server.pem").isFile());
       done();
    });
});
