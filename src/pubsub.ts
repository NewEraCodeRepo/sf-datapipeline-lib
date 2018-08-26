import * as Highland from "highland";

import { Event, IDelivery, IMessage, IMetadataWriterFn,
    IPublisher, IPublishResult, ISerde, ISubscriber } from "./index";

function createResult(err: Error|null): IPublishResult {
    return err != null ? {successful: false, error: err} : {successful: true};
}

export function buildPublishingTransform<TEvent extends Event>(
    publisher: IPublisher,
    topic: string,
    metadataWriter: IMetadataWriterFn<TEvent>,
    serde: ISerde<TEvent>,
): (event: TEvent) => IPublishResult {
    return (event: TEvent) => {
        event = metadataWriter(event);
        const msg = {
            key: event.key(),
            value: serde.serialize(event),
        };
        return createResult(publisher.publish(topic, msg));
    };
}

export function buildSubscriptionStream<TEvent extends Event>(
    subscriber: ISubscriber, topics: string[], serde: ISerde<TEvent>,
): Highland.Stream<IDelivery<TEvent>> {
    return Highland((
        push: (err: Error | null, x?: IDelivery<TEvent>) => void,
        next: () => void,
    ) => {
        subscriber
            .subscribe(topics)
            .on("error", push)
            .on("message", (msg: IMessage) => {
                const del = {
                    event: msg.value === null ? null : serde.deserialize(
                        msg.value,
                    ),
                    key: msg.key,
                    offset: msg.offset,
                };
                push(null, del);
            });
    });
}
