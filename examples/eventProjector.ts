import * as Highland from "highland";
import { buildMetadataWriter, Event, IDelivery, IPublisher, IPublishResult } from "../build/index";
import { buildPublisher, buildSubscriber } from "../build/kafka";
import { buildGetStateFn, buildSetStateFn, GetResult, ReduceFn, ReduceResult, SetResult } from "../build/projector";
import { buildPublishingTransform, buildSubscriptionStream } from "../build/pubsub";
import { OfferCreateEvent, OfferCreateEventSerde, OfferSetEvent, OfferSetEventtSerde } from "./index";
import { KVStore } from "./localDockerConnectorRedis";

enum DML_OPERATION {
    CREATE,
    UPDATE,
    DELETE,
}

interface IOfferRecord {
    id: string;
    merchant__c: string;
    name: string;
    copy_english__c: string;
    copy_french__c: string;
}

interface IDataChange {
    operation: DML_OPERATION;
    data: object;
}

// Build list of changes
const changes = [
    {
        data: {
            copy_english__c: "test",
            copy_french__c: "toto",
            id: "1",
            merchant__c: "123",
            name: "a",
        },
        operation: DML_OPERATION.CREATE,
    },
    {
        data: {
            copy_english__c: "test",
            copy_french__c: "toto",
            id: "2",
            merchant__c: "123",
            name: "b",
        },
        operation: DML_OPERATION.CREATE,
    },
    {
        data: {
            copy_english__c: "test",
            copy_french__c: "toto",
            id: "3",
            merchant__c: "124",
            name: "c",
        },
        operation: DML_OPERATION.CREATE,
    },
];

function changeToEvent(change: IDataChange): OfferCreateEvent {
    const data: IOfferRecord = change.data as IOfferRecord;
    return new OfferCreateEvent(data.id, data.merchant__c, data.name, data.copy_english__c, data.copy_french__c);
}

const inputTopic = "inputTest";
const projectedTopic = "projectedTest";
const kvStore = new KVStore();
const publisherClientId = "test.publisher";
const metadataWriter = buildMetadataWriter(publisherClientId);

const consumerClientId = "test.consumer";
const consumerGroupId = "test.consumer.group";
const subscriber = buildSubscriber("kafka:9092", consumerClientId, consumerGroupId);
const testConsumerClientId = "test.consumer";
const testConsumerGroupId = "test.consumer.group.test";
const testSubscriber = buildSubscriber("kafka:9092", testConsumerClientId, testConsumerGroupId);

buildPublisher("kafka:9092", publisherClientId)
    .then((publisher: IPublisher) => {
        const inputXform = buildPublishingTransform(publisher, inputTopic, metadataWriter, new OfferCreateEventSerde(publisherClientId));
        const inboundStream = buildSubscriptionStream(subscriber, [inputTopic], new OfferCreateEventSerde(consumerClientId));
        const projectedXform = buildPublishingTransform(publisher, projectedTopic, metadataWriter, new OfferSetEventtSerde(publisherClientId));
        const consumingStream = buildSubscriptionStream(testSubscriber, [projectedTopic], new OfferSetEventtSerde(testConsumerClientId));
        Highland(changes)
            .map<OfferCreateEvent>(changeToEvent)
            .map<IPublishResult>(inputXform)
            .each((result: IPublishResult) => result.successful ? console.info(`Published message to ${inputTopic}`) : console.error("Couldn't publish error", result.error))
            .done(() => {
                console.log("Finished producing on input topic");
            });
        const eventKeyFn = (event: OfferCreateEvent): string => event.id;
        const getStateFn = buildGetStateFn(kvStore, eventKeyFn);
        const setStateFn = buildSetStateFn(kvStore, eventKeyFn);
        const reduceFn = ([event, currentState]: [OfferCreateEvent, any]): [OfferCreateEvent, any, any] | Error => {
            const newState = {
                copyEnglish: event.copyEnglish,
                copyFrench: event.copyFrench,
                id: event.id,
                merchantId: event.merchantId,
                name: event.name,
            };
            return [event, currentState, newState];
        };
        inboundStream
            .errors((err: Error) => console.error("Projector consumer error", err))
            .map<OfferCreateEvent>((del: IDelivery<OfferCreateEvent>): any => del.event)
            .map<Highland.Stream<GetResult | Error>>((e: Event) => Highland(getStateFn(e)))
            .sequence()
            .map<ReduceResult | Error>(reduceFn)
            .map<Highland.Stream<SetResult | Error>>((input: ReduceResult) => Highland(setStateFn(input)))
            .sequence()
            .map<OfferSetEvent>(([event, oldState, newState]: SetResult) => new OfferSetEvent(newState.id, newState.merchantId, newState.name, newState.copyEnglish, newState.copyFrench))
            .map<IPublishResult>(projectedXform)
            .each((result: IPublishResult) => result.successful ? console.info(`Published message to ${projectedTopic}`) : console.error("Couldn't publish error", result.error))
            .done(() => console.log("Finished consuming on input topic"));
        consumingStream
            .map<OfferSetEvent>((del: IDelivery<OfferSetEvent>): any => del.event)
            .each((event: OfferSetEvent) => console.info("Received event", event))
            .done(() => console.log("Finished consuming on projected topic."));
    });
