/* tslint:disable */
import * as Highland from "highland";
import * as winston from "winston";
import { WinstonLogger } from "./logger";
import {isNullOrUndefined} from "util";

export interface IDefaultOptions<T> {
    logger?: winston.Logger;
    key: string;
    validateOffset? : boolean;
    eventStream: Highland.Stream<T>;
}

export class ConsumerStream<T, E> {
    private eventStream: Highland.Stream<T>;
    private logger: winston.Logger;
    private latestOffset: number;

    constructor(
        private transformStream: (item: T) => Highland.Stream<T>,
        protected options: IDefaultOptions<T>,
        protected callbacks: {
          done?: () => void,
          filter?: (item: T) => boolean,
          error?: (err: Error) => void;
          validateOffset?: (del: any) => boolean | Promise<boolean>;
        } = {},
    ) {
        this.logger = options.logger
            || WinstonLogger.getLogger("KAFKA-" + options.key);
        this.eventStream = options.eventStream;
    }

    public run() {
        this.eventStream
            .errors((err: Error) => {
                this.logger.error(err.message);
                this.callbacks.error && this.callbacks.error(err);
            })
            .flatMap((del: any) => {
                return Highland(async (push, next) => {
                    if(!isNullOrUndefined(this.options.validateOffset) && !isNullOrUndefined(del.offset)) {
                        let result;
                        if (this.callbacks.validateOffset) {
                            result = await this.callbacks.validateOffset(del);
                        } else {
                            result = this.validateOffset(del);
                        }
                        if (!result) {
                            this.logger.warn(`Processing message out of order. Latest offset: ${this.latestOffset} Current Offset: ${del.offset}`);
                        }
                    }

                    push(null, del);
                    push(null, Highland.nil);
                });
            })
            .filter((item: T) => {
                if(isNullOrUndefined(this.callbacks.filter)) {
                    this.callbacks.filter = (item: T) => {
                        return true;
                    };
                }

                return this.callbacks.filter(item);
            })
            .through((del: any) => {
                this.logger.profile(`Consumer test`);
                return del;
            })
            .flatMap(this.transformStream)
            .done(() => {
                this.logger.profile(`Consumer test`);
                this.callbacks.done && this.callbacks.done();
            });
    }

    private validateOffset(item): boolean {
        if(isNullOrUndefined(this.latestOffset)) {
            this.latestOffset = item.offset;
            return true;
        }

        const currentOffset = this.latestOffset + 1;
        const res = (currentOffset === item.offset);
        this.latestOffset++;
        return res;
    }
}
