import * as redis from "redis";

import { IKVStore } from "./localKvStore";

export class KVStore implements IKVStore {
    private client: redis.RedisClient;
    constructor(host: string = "127.0.0.1") {
        this.client = redis.createClient({ host });
    }

    public get(key: string): Promise<string|null|Error> {
        return new Promise((resolve, reject) => {
           this.client.get(key, (err, result) => {
               if (err) {
                   reject(err);
               } else {
                   resolve(result);
               }
           });
        });
    }

    public set(key: string, value: string): Promise<void|Error> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}
