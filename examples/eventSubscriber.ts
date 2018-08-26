"use strict";

import { IDelivery } from "../build/index";
import { buildSubscriber } from "../build/kafka";
import { buildSubscriptionStream } from "../build/pubsub";
import { SetStateEvent, SetStateEventSerde } from "./index";

const clientId = "example.consumer";
const subscriber = buildSubscriber("kafka:9092", clientId, "my-group-1");
const stream = buildSubscriptionStream(subscriber, ["test"], new SetStateEventSerde(clientId));
stream
    .each((del: IDelivery<SetStateEvent>) => {
        console.log(del.key);
        console.log(del.offset);
        console.log(del.event);
    })
    .done(() => {
        subscriber.disconnect()
            .then(() => console.log("Consumer disconnected"))
            .catch((err: Error) => console.error("Consumer disconnect error", err));
    });
