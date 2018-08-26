"use strict";

import { Event } from "./";
import { csvReader, ICSVRecord } from "./csv_reader";

import { expect } from "chai";
import "mocha";
import * as stream from "stream";

const fileData = `"Name","State"\r\n"Suresh","CA"\r\n"Mike",` +
`"IL"\r\n"John","PA"\r\n"Mark","TX"`;

class TestStream extends stream.Duplex {
    private chunks: string[];

    constructor() {
        super();
        this.chunks = [];
    }

    public _write(chunk: string, encoding: string, callback: () => void) {
        this.chunks.push(chunk);
    }

    public _read(size: number) {
        this.chunks.forEach((chunk) => this.push(new Buffer(chunk)));
        this.push(null);
    }
}

class SetStateEvent extends Event {
    constructor(public name: string, public state: string) {
        super();
    }

    public type(): string {
        return "com.rbc.offer_platform.events.set_state";
    }

    public key(): string {
        return this.name;
    }
}

const csvRecord2Event = (rec: ICSVRecord): SetStateEvent => {
    return new SetStateEvent(rec.Name, rec.State);
};

const writeStream = new TestStream();
writeStream.write(fileData);
writeStream.end();

describe("Generating events from a CSV file", () => {
    it("correctly transforms lines in a file", (done) => {
        csvReader(writeStream)
            .map<SetStateEvent>(csvRecord2Event)
            .toArray((events: SetStateEvent[]) => {
                expect(events.map((e: SetStateEvent) =>
                    ({name: e.name, state: e.state}))).to.eql([
                        {
                            name: "Suresh",
                            state: "CA",
                        },
                        {
                            name: "Mike",
                            state: "IL",
                        },
                        {
                            name: "John",
                            state: "PA",
                        },
                        {
                            name: "Mark",
                            state: "TX",
                        },
                ]);
                done();
            });
    });
});
