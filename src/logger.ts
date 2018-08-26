import * as colors from "colors/safe";
import { format } from "logform";
import * as winston from "winston";
import { Event, IDelivery } from "./index";
const safeStringify = require("fast-safe-stringify");

// keeping for backwards compatibility
export function logEvent(delivery: IDelivery<Event>, topic: string = "") {
    const printedTopic: string = topic === "" ? "" : `Topic: ${topic}, `;
    return `${printedTopic}key: ${delivery.key}, offset: ${delivery.offset},\
 event: ${JSON.stringify(delivery.event, null, "\t")}`;
}

export function safeJSON(obj) {
    function replacer(key, value) {
        if (value === "[Circular]") {
            return;
        }
        return value;
    }
    const serialized =
        safeStringify(obj, replacer, 2);
    console.log(serialized);
}

/* tslint:disable:max-line-length */
/**
 * Winston Logger
 *
 * formatted logger
 * @exaples:
 * import { WinstonLogger } from "datapipeline-lib"
 * const logger = WinstonLogger.getLogger("SOMETOPIC")
 * logger.info("Some Message")
 *
 * Output in the console will look like:
 * 2018-05-17T22:11:27.545Z [info][SOMETOPIC] : Some Message
 *
 * For profiling:
 * import { WinstonLogger } from "datapipeline-lib"
 * const logger = WinstonLogger.getLogger("SOMETOPIC")
 *
 * logger.profiler("Some message", { test: "start" }) <- put this where you want to start the time
 *
 * Some complex operation
 *
 * logger.profiler("Some message", { test: "end" }) <- Put this where you want to end the time
 *
 * Output in the console will look like:
 * 2018-05-18T22:04:50.624Z [profiler][SOMETOPIC-PROFILER] : Some Message started
 * 2018-05-18T22:04:50.625Z [profiler][SOMETOPIC-PROFILER] : Some Message done in (hr): 1.051085ms
 */
export class WinstonLogger {

    public static getLogger(
        label: string,
    ): winston.Logger {
        const logger = new WinstonLogger(label);
        return logger.getLogger();
    }

    private startTime: [number, number];
    private label: string;

    constructor(label: string) {
        this.label = label;
    }

    public getLogger() {
        // custom coloring and addition of new profiler log level
        const config = {
            colors: {
                debug: "blue",
                error: "red",
                info: "green",
                profiler: "blue",
                silly: "magenta",
                verbose: "cyan",
                warn: "yellow",
            },
            levels: {
                debug: 4,
                error: 0,
                info: 2,
                profiler: 6,
                silly: 5,
                verbose: 3,
                warn: 1,
            },
        };

        const loggerFormat = format.combine(
            format.colorize(),
            format.timestamp(),
            format.align(),
            format((info, opts) => {
                return info;
            })(),
            format.json(),
            format.printf((info) => {
                const logMessageBase = `${info.timestamp} [${info.level}][${this.label.toUpperCase()}`;

                const missingStartTimeMessage = "Log profiler has" +
                    " not been started yet." +
                    " Make sure to add \"logger.info(\"my message\"," +
                    " { profiler: \"start\" })\"";

                const wrongProfilerLevel = `Log profiler is initialized by using "logger.profile", not "logger.${colors.white(info.level)}"`;

                const wrongPropertyOrValues = `Log profiler requires the following options: "{ test: "start" }" or "{ test: "end" }"`;

                if (info[Symbol.for("level")] !== "profiler" && info.test) {
                    return `${info.timestamp} [${colors.red("profiler-error")}][${this.label.toUpperCase()}-PROFILER] : ${wrongProfilerLevel}`;
                }

                if (info[Symbol.for("level")] === "profiler") {

                    if (info.test === "start") {
                        this.startTime = process.hrtime();
                        return `${logMessageBase}-PROFILER] : ${info.message.trim()} started`;

                    } else if (info.test === "end") {
                        if (!this.startTime) {
                            return `${info.timestamp} [${colors.red("profiler-error")}][${this.label.toUpperCase()}-PROFILER] : ${missingStartTimeMessage}`;
                        }

                        const endTime = process.hrtime(this.startTime);
                        const endTimeInMs = endTime[0] * 1000 + endTime[1] / 1000000;
                        return `${logMessageBase}-PROFILER] : ${info.message.trim()} done in (hr): ${endTimeInMs}ms`;
                    }

                    return `${info.timestamp} [${colors.red("profiler-error")}][${this.label.toUpperCase()}-PROFILER] : ${wrongPropertyOrValues}`;
                }

                return `${logMessageBase}] : ${info.message.trim()}`;

            }),
        );

        const transports = {
            console: new winston.transports.Console({
                handleExceptions: true,
                level: "profiler",
            }),
        };

        winston.addColors(config.colors);

        return winston.createLogger({
                exitOnError: false,
                format: loggerFormat,
                levels: config.levels,
                transports: [
                    transports.console,
                ],
            });
    }

}
