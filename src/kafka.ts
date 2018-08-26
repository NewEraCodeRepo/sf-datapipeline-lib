"use strict";

import { EventEmitter } from "events";
// import * as lodash from "lodash";
import * as Kafka from "node-rdkafka";
import {IMessage, ITopicConfiguration} from "node-rdkafka";
import { IPublisher, IRecord, ISubscriber } from ".";
import {Event, IDelivery, ISerde} from "./index";

const Highland = require ("highland");

export const DEFAULT_CONSUMER_GLOBAL_CONFIGURATION = {
    // debug: "cgrp,topic,fetch",
    "enable.auto.commit": true,
    "event_cb": true,
    "heartbeat.interval.ms": 10000,
    "log.connection.close": true,
    // Syslog error level 7 means debug
    "log_level": 7,
    // Reconnect every 1 second +/- 50%
    "offset_commit_cb": true,
    "rebalance_cb": true,
    "reconnect.backoff.jitter.ms": 1000,
    "session.timeout.ms": 30000,
    // Collect statistics every 5 seconds
    "statistics.interval.ms": 5000,
};

export const DEFAULT_CONSUMER_TOPIC_CONFIGURATION = {
    "request.required.acks": 1,
};

export const DEFAULT_PRODUCER_GLOBAL_CONFIGURATION = {
    // debug: "broker,topic,msg",
    "dr_cb": true,
    "dr_msg_cb": true,
    "event_cb": true,
    "log.connection.close": true,
    // Syslog error level 7 means debug
    "log_level": 7,
    // Reconnect every 1 second +/- 50%
    "reconnect.backoff.jitter.ms": 1000,
    // Collect statistics every 5 seconds
    "statistics.interval.ms": 5000,
};

export const DEFAULT_PRODUCER_TOPIC_CONFIGURATION = {
    "request.required.acks": 1,
};

const LOG_BATCH_SIZE = parseInt(
    process.env.LOG_BATCH_SIZE || "100", 10);

const LOG_FLUSH_INTERVAL = parseInt(
    process.env.LOG_FLUSH_INTERVAL || "5000", 10);

export interface IConsumerConfiguration {
    globalConfig: Kafka.IGlobalConfiguration;
    topicConfig: Kafka.ITopicConfiguration;
    commitMessageCount: number;
}

export interface IProducerConfiguration {
    globalConfig: Kafka.IGlobalConfiguration;
    topicConfig: Kafka.ITopicConfiguration;
}

export type ConsumerConfigBuilder = (
    brokerList: string, clientId: string, groupId: string,
) => IConsumerConfiguration;
export type ProducerConfigBuilder = (
    brokerList: string, clientId: string,
) => IProducerConfiguration;

export function defaultConsumerConfigBuilder(
    brokerList: string, clientId: string,
    groupId: string, globalConfig: Partial<Kafka.IGlobalConfiguration> = {},
    topicConfig: Partial<ITopicConfiguration> = {},
): IConsumerConfiguration {
    const consumerGlobalConfig = {
        ...DEFAULT_CONSUMER_GLOBAL_CONFIGURATION,
        ...globalConfig,
    };
    const consumerTopicConfig = {
        ...DEFAULT_CONSUMER_TOPIC_CONFIGURATION,
        ...topicConfig,
    };
    return {
        commitMessageCount: 0,
        globalConfig: {...consumerGlobalConfig,
            "client.id": clientId,
            "group.id": groupId,
            "metadata.broker.list": _sanitizeKafkaURL(brokerList),
        },
        topicConfig: consumerTopicConfig,
    };
}

export function defaultProducerConfigBuilder(
    brokerList: string, clientId: string,
    globalConfig: Partial<Kafka.IGlobalConfiguration> = {},
    topicConfig: Partial<ITopicConfiguration> = {},
): IProducerConfiguration {
    const producerGlobalConfig = {
        ...DEFAULT_PRODUCER_GLOBAL_CONFIGURATION,
        ...globalConfig,
    };
    const producerTopicConfig = {
        ...DEFAULT_PRODUCER_TOPIC_CONFIGURATION,
        ...topicConfig,
    };
    return {
        globalConfig: {...producerGlobalConfig,
            "client.id": clientId,
            "metadata.broker.list": _sanitizeKafkaURL(brokerList),
        },
        topicConfig: producerTopicConfig,
    };
}

class Publisher implements IPublisher {
    constructor(private producer: Kafka.Producer) {}
    public isConnected(): boolean {
        return this.producer.isConnected();
    }
    public disconnect(): Promise<void|Error> {
        return new Promise((resolve, reject) => {
            this.producer.flush(2000, (err: Error) => {
                if (err) {
                    console.error(`${process.pid} [DP-L] Flush error`, err);
                    reject(err);
                } else {
                    this.producer.disconnect((e: Error) => {
                        if (e) {
                            console.error(`${process.pid} [DP-L] Disconnect error`, e);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });
        });
    }
    public publish(topic: string, rec: IRecord): Error|null {
        return this.producer.produce(
            topic, -1, rec.value, rec.key, Date.now(), {},
            ) ? null : this.producer.getLastError();
    }
}

export function buildPublisher(
    brokerList: string, clientId: string,
    configBuilder: ProducerConfigBuilder = defaultProducerConfigBuilder,
): Promise<IPublisher> {
    return new Promise<IPublisher>((resolve, reject) => {
        const config: IProducerConfiguration = configBuilder(
            _sanitizeKafkaURL(brokerList), clientId)
        ;

        console.info(`${process.pid} [DL-L] Creating a publisher using the following configs:`,
            JSON.stringify(config.globalConfig), config.topicConfig);

        const producer = new Kafka.Producer(
            config.globalConfig,
            config.topicConfig,
        );
        let queue: string[] = [];
        setInterval(() => {
            if (queue.length > 0) {
                console.info(`${process.pid} [DP-L] Delivered: ` + queue);
                queue = [];
            }
        }, LOG_FLUSH_INTERVAL);
        producer.connect();
        producer.setPollInterval(100);
        producer
            .on("ready", () => {
                console.info(`${process.pid} [DP-L] New publisher created and ready`);
                resolve(new Publisher(producer));
            })
            .on("error", (error) => {
                console.error(`${process.pid} [DP-L] ERROR from producer:`, error);
                reject();
            })
            // .on("event", (event: string) => console.info(
            //     "[DP-L] Producer event received", JSON.stringify(event),
            // ))
            .on("event.error", (err: Error) => console.error(
                "[DP-L] Producer (stream) error", JSON.stringify(err),
            ))
            .on("event.throttle", (log: string) =>
                console.info(`${process.pid} [DP-L] Event Throttle`, JSON.stringify(log)))
            // .on("event.stats", (log: string)
            //      => console.info("[DP-L] Event Stats", JSON.stringify(log)))
            .on("disconnected", (log: string) =>
                console.info(`${process.pid} [DP-L] Disconnected`, JSON.stringify(log)))
            .on("delivery-report", (err: Error, deliveryReport: any) => {
                if (err) {
                    console.error(`${process.pid} [DP-L] Delivery Error`, err);
                } else {
                    queue.push(`Message:` +
                        `${deliveryReport.topic}/` +
                        `${deliveryReport.key}`);
                    if (queue.length > LOG_BATCH_SIZE) {
                        console.info(`${process.pid} [DP-L] Delivered: ` + queue);
                        queue = [];
                    }
                }
            });
    });
}

class Subscriber extends EventEmitter implements ISubscriber {
    // private topicToListOfPartitions;
    private stream;
    // constructor(private consumer: Kafka.KafkaConsumer) {
    //     super();
    // }
    constructor(private config: IConsumerConfiguration) {
        super();
    }
    public isConnected(): boolean {
        return this.stream.consumer.isConnected();
    }
    public disconnect(): Promise<void|Error> {
        return new Promise((resolve, reject) => {
            this.stream.consumer.disconnect((err: Error, metrics: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public subscribeStream<TEvent extends Event>(
        topics: string[],
        serde: ISerde<TEvent>):
        Highland.Stream<IDelivery<TEvent>> {

        console.info(`${process.pid} [DL-L] Creating a consumer with a read stream using the following configs:`,
            topics, JSON.stringify(this.config.globalConfig), this.config.topicConfig);

        this.stream = Kafka.KafkaConsumer
            .createReadStream(this.config.globalConfig,
            this.config.topicConfig, {topics});

        this.stream
            .on("error", (err: Error) => {
                console.error(`${process.pid} [DP-L] Consumer error, exiting`, err);
                process.exit(1);
            })
            .on("event.error", (err: Error) =>  {
                console.error(`${process.pid} [DP-L] Consumer event error`, err);
            });

        let queue: string[] = [];
        setInterval(() => {
            if (queue.length > 0) {
                console.info(`${process.pid} [DP-L] Consumed: ` + queue);
                queue = [];
            }
        }, LOG_FLUSH_INTERVAL);
        return Highland(this.stream, (req: any, callback: any) => {
            req.on("end", callback)
                .on("close", callback)
                .on("error", callback);

            return () => {
                req.removeListener("end", callback);
                req.removeListener("close", callback);
                req.removeListener("error", callback);
            };
        }).map((msg: IMessage) => {
                queue.push(`Message:` +
                    `${msg.topic}/` +
                    `${msg.key}`);
                if (queue.length > LOG_BATCH_SIZE) {
                    console.info(`${process.pid} [DP-L] Consumed: ` + queue);
                    queue = [];
                }
                return {
                    event: msg.value === null ? null : serde.deserialize(
                        msg.value,
                    ),
                    key: msg.key,
                    offset: msg.offset,
                };
            });
    }

    public subscribe(topics: string[]): ISubscriber {
        // const self = this;

        this.stream.consumer.connect();
        this.stream.consumer
            .on("ready", () => {
                console.info(`${process.pid} [DP-L] Consumer is ready`);
                this.stream.consumer.subscribe(topics);
                this.stream.consumer.consume();
            })
            // .once("data", () => {
            //     const assignments = this.stream.consumer.assignments();
            //     self.topicToListOfPartitions =
            //         lodash.groupBy(assignments, (tp) => tp.topic);
            // })
            .on("data", (msg: IMessage) => {
                // const contextListOfPartitions =
                //     self.topicToListOfPartitions[msg.topic];

                // this.consumer.pause(contextListOfPartitions);

                try {
                    this.emit("message", {
                        key: msg.key,
                        offset: msg.offset,
                        value: msg.value,
                    });
                    this.stream.consumer.commitMessage(msg);
                } finally {
                    // this.consumer.resume(contextListOfPartitions);
                }
            })
            .on("offset.commit", (offsets) => {
                // Learn more about the offset.commit event and rebalance event here:
                // https://github.com/Blizzard/node-rdkafka/pull/185/files
                console.info(`${process.pid} [DP-L] Offset Commit Successful:`, JSON.stringify(offsets));
            })
            .on("rebalance", (err, assignment) => {
                // Learn more about the offset.commit event and rebalance event here:
                // https://github.com/Blizzard/node-rdkafka/pull/185/files
                if (err) {
                    console.error(`${process.pid} [DP-L] Consumer rebalance failed:`, JSON.stringify(err));
                } else {
                    console.error(`${process.pid} [DP-L] Consumer rebalance succeed:`, JSON.stringify(assignment));
                }
            })
            .on("error", (err: Error) => {
                console.error("Consumer Received an Error",
                    JSON.stringify(err));
                this.disconnect()
                .catch((error: Error) => {
                    console.error(`${process.pid} [DP-L] Attempt to disconnect Failed. Consumer disconnect error`,
                        JSON.stringify(err));
                    this.emit("error", err);
                });
            })
            .on("disconnected", (log: string) =>
                console.info(`${process.pid} [DP-L] Consumer is explicitly being disconnected`, JSON.stringify(log)))
            .on("event.throttle", (log: string) =>
                console.info(`${process.pid} [DP-L] Consumer Event Throttle`, JSON.stringify(log)))
            // .on("event.stats", (log: string) =>
            //      console.info("[DP-L] Consumer Event Stats", JSON.stringify(log)))
            .on("event.error", (err: Error) =>  {
                console.error(`${process.pid} [DP-L] Consumer Event Received (Error)`, JSON.stringify(err));
                this.disconnect()
                .catch((error: Error) => {
                    console.error(`${process.pid} [DP-L] Attempt to disconnect Failed. Consumer disconnect error`,
                        JSON.stringify(err));
                    this.emit("error", err);
                });
            });
        return this;
    }
}

export function buildSubscriber(
    brokerList: string,
    clientId: string,
    groupId: string,
    configBuilder: ConsumerConfigBuilder = defaultConsumerConfigBuilder,
): ISubscriber {
    const config: IConsumerConfiguration = configBuilder(
        _sanitizeKafkaURL(brokerList), clientId, groupId,
    );
    // const consumer = new Kafka.KafkaConsumer(
    //     config.globalConfig,
    //     config.topicConfig,
    // );
    return new Subscriber(config);
}

/**
 * Strips away "kafka+" if it's found at the beginning of the string passed in
 * Heroku automatically adds this whenever they update the KAFKA_URLs
 * @param kafkaUrl The url to transform, or not
 */
const _sanitizeKafkaURL =
    (kafkaUrl: string) => kafkaUrl.replace(/kafka\+/g, "");
