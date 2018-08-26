/* tslint:disable */
import { expect } from "chai";
import { IEventMetadata } from "datapipeline-schemas";
import "mocha";
import * as MockDate from "mockdate";
import { MESSAGE } from "triple-beam";
const TransportStream = require('winston-transport');
import { Event } from "./index";
import { logEvent, WinstonLogger } from "./logger";
import * as Highland from "highland";
import { Stream } from "stream";
import * as winston from "winston";

class MyTestEvent extends Event {
    public metadata: IEventMetadata = {
        createdAt: 34563456,
        createdClientId: "clientId",
        guid: "someGuid",
        type: "anotherType",
    };

    public key() {
        return "someKey";
    }

    public type() {
        return "someType";
    }

}

const testEvent = new MyTestEvent();
const delivery  = {
    event: testEvent,
    key: "someKey",
    offset: 10000,
};

const topicContent = `Topic: offers, key: someKey, offset: 10000, event: {
	"metadata": {
		"createdAt": 34563456,
		"createdClientId": "clientId",
		"guid": "someGuid",
		"type": "anotherType"
	}
}`;

const noTopicContent = `key: someKey, offset: 10000, event: {
	"metadata": {
		"createdAt": 34563456,
		"createdClientId": "clientId",
		"guid": "someGuid",
		"type": "anotherType"
	}
}`;

describe("Logger", () => {
    describe("logEvent", () => {
        it("takes a topic and delivery event and returns a string", () => {
            const topic = "offers";
            const logMessage = logEvent(delivery, topic);
            expect(logMessage).to.equal(topicContent);
            expect(logMessage).to.be.a("string");
        });

        it("will optionally output the topic", () => {
            expect(logEvent(delivery)).to.equal(noTopicContent);
        });
    });

    describe("Winston Logger ", () => {

        let logger: winston.Logger;

        beforeEach(() => {
            logger = WinstonLogger.getLogger(topic);
        });

        const topic = "KAFKA-678";

        const stringer = (string) => {
            const arr = string.split('');
            return new Stream.Readable({
                read: function (size) {
                    this.push(arr.shift())
                }
            });
        };

        const readable = stringer("string");

        const delay = (x) => (new Promise((resolve) => setTimeout(resolve, x)));

        const asyncProcessor = async (character) => {
            await delay(1000);
            return character.toString("utf-8");
        };

        it("takes a topic and returns a formatted string", (done) => {
            MockDate.set(new Date('2018-05-04').toISOString());
            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.be.a("string");
                    expect(info[Symbol.for('level')]).equals("info");
                    expect(info.timestamp).equals('2018-05-04T00:00:00.000Z');
                    expect(info[Symbol.for('message')]).equals(
                        '2018-05-04T00:00:00.000Z [\u001b[32minfo\u001b[39m][KAFKA-678] : Running',
                    );
                    done();
                },
            });

            logger.add(transport);
            logger.info("Running");
            MockDate.reset();
        });

        it("profiler will profile a streaming operation", function(done) {
            Highland(readable)
                .errors((err: Error) => {
                    logger.error(err.message);
                })
                .tap((x) => { 
                    logger.profile("Running")
                })
                .flatMap((char) => {
                    return Highland(async (push, next) => {
                        const letters = await asyncProcessor(char);
                        push(null, letters);
                        push(null, Highland.nil);
                    })
                })
                .through((x) => {
                    logger.profile("Running");
                    done();
                });

            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.contain("ms");
                    expect(info[MESSAGE]).to.be.a("string");
                    expect(info[Symbol.for('level')]).equals("profiler");
                    expect(info.test).to.exist;
                    expect(info.timestamp).to.contain('2018-06-04T15');
                    expect(info[Symbol.for('message')]).to.contain(
                        '[KAFKA-678-PROFILER] : Running done in (hr):',
                    );
                },
            });

            logger.add(transport);
        });

        it("profiler will throw an error if profiler has a bad property", function(done) {
            Highland(readable)
                .errors((err: Error) => {
                    logger.error(err.message);
                })
                .tap((x) => logger.profile("Has a bad prop"))
                .flatMap((char) => {
                    return Highland(async (push, next) => {
                        const letters = await asyncProcessor(char);
                        push(null, letters);
                        push(null, Highland.nil);
                    })
                })
                .through((x) => {
                    done();
                });

            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.contain("Log profiler requires the following options");
                    expect(info[MESSAGE]).to.be.a("string");
                    expect(info[Symbol.for('level')]).equals("profiler-error");
                    expect(info.test).to.not.exist;
                    expect(info[Symbol.for('message')]).to.contain(
                        '[KAFKA-678-PROFILER]',
                    );
                },
            });

            logger.add(transport);
        });

        it("profiler will throw an error if profiler has not started and is info level", function(done) {
            Highland(readable)
                .errors((err: Error) => {
                    logger.error(err.message);
                })
                .flatMap((char) => {
                    return Highland(async (push, next) => {
                        const letters = await asyncProcessor(char);
                        push(null, letters);
                        push(null, Highland.nil);
                    })
                })
                .through((x) => {
                    logger.info("Has no start and is info", { test: "end" });
                    done()
                });

            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.contain("Log profiler is initialized by using");
                    expect(info[MESSAGE]).to.be.a("string");
                    expect(info[Symbol.for('level')]).equals("profiler-error");
                    expect(info.test).to.exist;
                    expect(info[Symbol.for('message')]).to.contain(
                        '[KAFKA-678-PROFILER]',
                    );
                },
            });

            logger.add(transport);
        });

        it("profiler will throw an error if profiler has not started and is profiler level", function(done) {
            Highland(readable)
                .errors((err: Error) => {
                    logger.error(err.message);
                })
                .flatMap((char) => {
                    return Highland(async (push, next) => {
                        const letters = await asyncProcessor(char);
                        push(null, letters);
                        push(null, Highland.nil);
                    })
                })
                .through((x) => {
                    logger.profile("Has no start profiler");
                    done()
                });

            const transport = new TransportStream({
                log: (info) => {
                    expect(info[MESSAGE]).to.contain(topic);
                    expect(info[MESSAGE]).to.contain("Log profiler has not been started yet");
                    expect(info[MESSAGE]).to.be.a("string");
                    expect(info[Symbol.for('level')]).equals("profiler-error");
                    expect(info.test).to.exist;
                    expect(info[Symbol.for('message')]).to.contain(
                        '[KAFKA-678-PROFILER]',
                    );
                },
            });

            logger.add(transport);
        });
    });
});
