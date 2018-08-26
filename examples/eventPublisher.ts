"use strict";

import * as fs from "fs";

import { csvReader, ICSVRecord } from "../build/csv_reader";
import { buildMetadataWriter, IPublisher, IPublishResult, } from "../build/index";
import { buildPublisher } from "../build/kafka";
import { buildPublishingTransform } from "../build/pubsub";
import { SetStateEvent, SetStateEventSerde } from "./index";

const readStream = fs.createReadStream(__dirname + "./data.csv");
const hStream = csvReader(readStream);

const csvRecord2Event = (rec: ICSVRecord): SetStateEvent => {
    return new SetStateEvent(rec.Name, rec.State);
};

const clientId = "test.publisher";
const metadataWriter = buildMetadataWriter(clientId);
buildPublisher("kafka:9092", clientId)
    .then((publisher: IPublisher) => {
        const xform = buildPublishingTransform(publisher, "test", metadataWriter, new SetStateEventSerde(clientId));
        hStream
            .map<SetStateEvent>(csvRecord2Event)
            .map<IPublishResult>(xform)
            .each((x: IPublishResult) => {
                console.log(x);
            })
            .done(() => {
                publisher.disconnect()
                    .then(() => console.log("Publisher disconnected."))
                    .catch((err: Error) => console.error("Publisher disconnect error", err));
            });
    })
    .catch((e: Error) => {
        throw e;
    });
