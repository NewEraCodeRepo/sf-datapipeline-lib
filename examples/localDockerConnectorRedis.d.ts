import { IKVStore } from "./localKvStore";
export declare class KVStore implements IKVStore {
    private client;
    constructor(url?: string);
    get(key: string): Promise<string | null | Error>;
    set(key: string, value: string): Promise<void | Error>;
}
