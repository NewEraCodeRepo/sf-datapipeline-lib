/* tslint:disable */
import { expect } from "chai";
import "mocha";
import { EventEmitter } from "events";
import { MESSAGE } from "triple-beam";
import { ConsumerStream } from "./consumer_stream";
const TransportStream = require('winston-transport');
import { WinstonLogger, safeJSON } from "./logger";
import {Event, IDelivery, IEventMetadata, IMessage, ISerde, ISubscriber} from "./index";
import * as Highland from "highland";
import {buildSubscriptionStream} from "./pubsub";
import * as MockDate from "mockdate";
const topic = "KAFKA-000";

const logger = WinstonLogger.getLogger(topic);

class TestSubscriber extends EventEmitter implements ISubscriber {
    public constructor() {
        super();
    }
    public sendMessage(msg: IMessage) {
        this.emit("message", msg);
    }
    public sendError(err: Error) {
        this.emit("error", err);
    }
    public subscribe(topics: string[]): ISubscriber {
        return this;
    }

    public subscribeStream<TEvent extends Event>(
        topics: string[],
        serde: ISerde<TEvent>):
        Highland.Stream<IDelivery<TEvent>> {

        return Highland(async (push, next) => {
            push(null, {
                event: null,
                key: "1",
                offset: 1,
            });
            push(null, Highland.nil);
        })

    }

    public isConnected(): boolean {
        return true;
    }
    public disconnect(): Promise<void|Error> {
        return Promise.resolve();
    }
}

class TestEvent2 extends Event {
    constructor(public foo: string) {
        super();
    }
    public type(): string { return "test"; }
    public key(): string { return "test"; }
    public toBuffer(): Buffer {
        return new Buffer(JSON.stringify({
            foo: this.foo,
        }));
    }
}

class TestEvent2Serde implements ISerde<TestEvent2> {
    constructor(private clientId: string) {} // tslint:disable-line
    public deserialize(buf: Buffer): TestEvent2 {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new TestEvent2(doc.foo);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: TestEvent2): Buffer {
        return new Buffer(JSON.stringify({
            foo: event.foo,
        }));
    }
}

describe("ConsumerStream", function () {
    describe("logEvent", function () {
        it("takes a complex transform stream with an async function and creates a profile log message", async function () {
            // mock subscriber
            const subscriber = new TestSubscriber();
            const stream = buildSubscriptionStream(
                subscriber, ["test"], new TestEvent2Serde(""),
            );
            // mock async function
            const delay = (x) => (new Promise((resolve) => setTimeout(resolve, x)));

            const asyncProcessor = async (item) => {
                await delay(1000);
                const word = item!.event.foo;
                const wordToUpperCase = word.toUpperCase();
                const checkWords = wordToUpperCase === "BAR"
                    || wordToUpperCase === "BLAH"
                    || wordToUpperCase === "DONE";
                expect(checkWords).to.be.true;
                return word.toUpperCase();
            };
            let latestOffset = 0;
            // mock transform stream with async function
            const transformStream = (item) => {
                return Highland(async (push, next) => {
                    await asyncProcessor(item);
                    push(null, item);
                    push(null, Highland.nil);
                })
                .each((el) => {
                    if(el && el["event"]) {
                        const foo = el["event"]["foo"];
                        const key = el["key"];
                        const offset = el["offset"];
                        const checkFoo = foo === "bar" || foo === "blah" || foo === "done";
                        const checkKey = key === "test" || key === "duh" || key === "done";
                        expect(offset).to.eq(latestOffset);
                        latestOffset++;
                        const checkOffset = parseInt(offset, 10) < 3;
                        expect(checkFoo).to.be.true;
                        expect(checkKey).to.be.true;
                        expect(checkOffset).to.be.true;
                    }

                })
            };
            // consumer stream
            const consumerStream = new ConsumerStream(
                transformStream,
                {
                logger,
                key: topic,
                eventStream: stream,
            });

            consumerStream.run();

            // event messages
            subscriber.sendMessage(
                {
                    key: "test",
                    offset: 0,
                    value: new Buffer(JSON.stringify({foo: "bar"})),
                },
            );
            subscriber.sendMessage(
                {
                    key: "duh",
                    offset: 1,
                    value: new Buffer(JSON.stringify({foo: "blah"})),
                },
            );
            subscriber.sendMessage(
                {
                    key: "done",
                    offset: 2,
                    value: new Buffer(JSON.stringify({foo: "done"})),
                },
            );
            await subscriber.disconnect();

            // test profiler
            MockDate.set(new Date('2018-05-04').toISOString());
            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.contain("Consumer test");
                    expect(info[Symbol.for('level')]).equals("info");
                    // expect(info.test).to.exist;
                },
            });

            logger.add(transport);
            MockDate.reset();
        });

        it("Should print message about incorrect offset", async function () {
            // mock subscriber
            const subscriber = new TestSubscriber();
            const stream = buildSubscriptionStream(
                subscriber, ["test"], new TestEvent2Serde(""),
            );
            // mock async function
            const delay = (x) => (new Promise((resolve) => setTimeout(resolve, x)));

            const asyncProcessor = async (item) => {
                await delay(1000);
                const word = item!.event.foo;
                const wordToUpperCase = word.toUpperCase();
                const checkWords = wordToUpperCase === "BAR"
                    || wordToUpperCase === "BLAH"
                    || wordToUpperCase === "DONE";
                expect(checkWords).to.be.true;
                return word.toUpperCase();
            };
            // mock transform stream with async function
            const transformStream = (item) => {
                return Highland(async (push, next) => {
                    await asyncProcessor(item);
                    push(null, item);
                    push(null, Highland.nil);
                })
                    .each((el) => {
                        if(el && el["event"]) {
                            const foo = el["event"]["foo"];
                            const key = el["key"];
                            const offset = el["offset"];
                            const checkFoo = foo === "bar" || foo === "blah" || foo === "done";
                            const checkKey = key === "test" || key === "duh" || key === "done";
                            const checkOffset = parseInt(offset, 10) < 3;
                            expect(checkFoo).to.be.true;
                            expect(checkKey).to.be.true;
                            expect(checkOffset).to.be.true;
                        }

                    })
            };
            // consumer stream
            const consumerStream = new ConsumerStream(
                transformStream,
                {
                    logger,
                    key: topic,
                    eventStream: stream,
                    validateOffset: true,
                });

            consumerStream.run();

            // event messages
            subscriber.sendMessage(
                {
                    key: "test",
                    offset: 1,
                    value: new Buffer(JSON.stringify({foo: "bar"})),
                },
            );
            subscriber.sendMessage(
                {
                    key: "duh",
                    offset: 0,
                    value: new Buffer(JSON.stringify({foo: "blah"})),
                },
            );
            subscriber.sendMessage(
                {
                    key: "done",
                    offset: 2,
                    value: new Buffer(JSON.stringify({foo: "done"})),
                },
            );
            await subscriber.disconnect();

            // test profiler
            MockDate.set(new Date('2018-05-04').toISOString());
            const transport = new TransportStream({
                log: (info) => {
                    expect(info.message).to.contain("Processing message out of order");
                    expect(info.level).to.contain("warn");
                },
            });

            logger.add(transport);
            MockDate.reset();
        });
    });
});
