export { buildPublisher,
    buildSubscriber, defaultProducerConfigBuilder,
    IProducerConfiguration, defaultConsumerConfigBuilder,
    IConsumerConfiguration } from "./kafka";
export { buildGetStateFn,
    buildSetStateFn, GetResult,
    ReduceFn, ReduceResult, SetResult } from "./projector";
export { buildPublishingTransform, buildSubscriptionStream } from "./pubsub";
import { KVStore } from "./redis"; // tslint:disable-line

export interface IEventMetadata {
    type: string;
    guid: string;
    createdAt: number;
    createdClientId: string;
}

export const NAMESPACE: string = "com.rbc.offer_platform";

export abstract class Event {
    public metadata: IEventMetadata;
    public abstract type(): string;
    public abstract key(): string;
}

export type IStreamCompleted = any;

export type IBaseSetEvent = any;

export type IBaseData = any;

export type IBaseRecordRepository = any;

export type IMetadataWriterFn<TEvent extends Event> = (event: TEvent) => TEvent;

export function buildMetadataWriter
<TEvent extends Event>(clientId: string): IMetadataWriterFn<TEvent> {
    return (event: TEvent): TEvent => {
        const metadata: IEventMetadata = {
            createdAt: Date.now(),
            createdClientId: clientId,
            guid: "test",
            type: event.type(),
        };
        event.metadata = metadata;
        return event;
    };
}

export interface IRecord {
    key: string;
    value: Buffer|null;
}

export interface IMessage extends IRecord {
    offset: number;
}

export interface IPublishResult {
    error?: Error;
    successful: boolean;
}

export interface IPubSubClient {
    isConnected(): boolean;
    disconnect(): Promise<void|Error>;
}
export interface IPublisher extends IPubSubClient {
    publish(topic: string, msg: IRecord): Error|null;
}

export interface IDelivery<TEvent extends Event> {
    event: TEvent | null;
    key: string;
    offset: number;
}

export interface IMessageEventHandling {
    on(event: "message", listener: (msg: IMessage) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
}

export interface ISubscriber extends IPubSubClient, IMessageEventHandling {
    subscribe(topics: string[]): ISubscriber;
    subscribeStream<TEvent extends Event>(
        topics: string[],
        serde: ISerde<TEvent>):
        Highland.Stream<IDelivery<TEvent>>;
}

export interface ISerde<TEvent extends Event> {
    deserialize(buf: Buffer): TEvent;
    serialize(event: TEvent): Buffer;
}

export type PublishTransform = (event: Event) => IPublishResult;
export * from "./events";
export * from "./heroku";
export * from "./consumer_stream";
