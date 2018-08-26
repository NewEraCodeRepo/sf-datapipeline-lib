export interface IKVStore {
    get(key: string): Promise<string|null|Error>;
    set(key: string, value: string): Promise<void|Error>;
}
