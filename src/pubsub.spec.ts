import { expect } from "chai";
import { EventEmitter } from "events";
import * as Highland from "highland";
import "mocha";

import {
    buildMetadataWriter, Event, IDelivery,
    IEventMetadata, IMessage, IPublisher, ISerde,
    ISubscriber,
} from "./index";
import { buildPublishingTransform, buildSubscriptionStream } from "./pubsub";

class TestPublisher implements IPublisher {
    private error: Error;
    constructor(error?: Error) {
        if (error) {
            this.error = error;
        }
    }
    public publish(topic: string, msg: IMessage): Error|null {
        if (this.error) {
            return this.error;
        } else {
            return null;
        }
    }
    public isConnected(): boolean {
        return true;
    }
    public disconnect(): Promise<void|Error> {
        return Promise.resolve();
    }
}

class TestEvent extends Event {
    constructor(public name: string) {
        super();
    }
    public type(): string {
        return "com.rbc.offer_platform.events.test";
    }
    public key(): string {
        return this.name;
    }
    public toBuffer(): Buffer {
        return new Buffer(
            JSON.stringify({
                name: this.name,
            }),
        );
    }
}

class TestEventSerde implements ISerde<TestEvent> {
    constructor(private clientId: string) {} // tslint:disable-line
    public deserialize(buf: Buffer): TestEvent {
        const doc = JSON.parse(buf.toString());
        const metadata: IEventMetadata = doc.metadata;
        const event = new TestEvent(doc.name);
        event.metadata = metadata;
        return event;
    }
    public serialize(event: TestEvent): Buffer {
        return new Buffer(JSON.stringify({
            name: event.name,
        }));
    }
}

describe("buildPublishingTransform", () => {
    const clientId = "test.publisher";
    const metadataWriter = buildMetadataWriter(clientId);
    it("should build a transform and process messages successfully", (done) => {
        const publisher = new TestPublisher();
        const transform = buildPublishingTransform(
            publisher, "test", metadataWriter, new TestEventSerde(""),
        );
        expect(transform(new TestEvent("foo"))).to.eql({successful: true});
        done();
    });
    it("should build a transform and process messages and Error", (done) => {
        const error = new Error("Test");
        const publisher = new TestPublisher(error);
        const transform = buildPublishingTransform(
            publisher, "test", metadataWriter, new TestEventSerde(""),
        );
        expect(
            transform(new TestEvent("bar")),
        ).to.eql({successful: false, error});
        done();
    });
});

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
        });
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
        return new Buffer(JSON.stringify({foo: this.foo}));
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

describe("buildSubscriptionStream", () => {
    it("should produce a Highland stream of IDelivery reports", (done) => {
        const subscriber = new TestSubscriber();
        const stream = buildSubscriptionStream(
            subscriber, ["test"], new TestEvent2Serde(""),
        );
        stream
            .pull((err: Error, del: IDelivery<TestEvent2>) => {
                expect(err).to.eql(null);
                expect(del.offset).to.eql(0);
                expect(del.key).to.eql("test");
                const event: TestEvent2|null = del.event;
                expect(event).not.eql(null);
                if (event !== null) {
                    expect(event.foo).to.eql("bar");
                }
                done();
            });
        subscriber.sendMessage(
        {
                key: "test",
                offset: 0,
                value: new Buffer(JSON.stringify({foo: "bar"})),
            },
        );
    });
    it("should produce errors in the stream if " +
        "they are returned from the subscriber", (done) => {
        const subscriber = new TestSubscriber();
        const stream = buildSubscriptionStream(
            subscriber, ["test"], new TestEvent2Serde(""),
        );
        const err = new Error("test");
        stream
            .pull((e: Error, del: IDelivery<TestEvent2>) => {
                expect(e).to.eql(err);
                expect(del).to.eql(undefined);
                done();
            });
        subscriber.sendError(err);
    });
});
