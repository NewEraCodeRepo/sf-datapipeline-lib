import * as redis from "redis";

import { IKVStore } from "./kvStore";

export class KVStore implements IKVStore {
    private client: redis.RedisClient;
    constructor(url: string = "redis://redis:6379") {
        this.client = redis.createClient(url);
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
