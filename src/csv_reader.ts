import * as Highland from "highland";
import * as stream from "stream";

const parse = require("csv-parse/lib/sync");

export interface ICSVRecord {
    [index: string]: string;
}

export function csvReader(input: stream.Readable): Highland.Stream<ICSVRecord> {
    return Highland(input).map<ICSVRecord[]>((line: string) =>
        parse(line, {columns: true})).flatten<ICSVRecord>();
}
