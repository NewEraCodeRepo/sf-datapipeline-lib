import { Event } from "./index";
import { IKVStore } from "./kvStore";

export type GetResult = [Event, any|null];
export type ReduceResult = [Event, any|null, any];
export type SetResult = [Event, any|null, any];

export type KeyFn = (event: Event) => string | null;
export type GetStateFn = (event: Event) => Promise<GetResult|Error>;
export type ReduceFn = (input: GetResult) => ReduceResult|Error;
export type SetStateFn = (input: ReduceResult) => Promise<SetResult|Error>;

export function buildGetStateFn(kvStore: IKVStore, keyFn: KeyFn): GetStateFn {
    return (event: Event): Promise<GetResult|Error> => {
        const key = keyFn(event);
        if (key === null) {
            return Promise.reject(
                new Error("[DP-L] Key could not be generated for event."),
            );
        }
        return kvStore.get(key)
            .then<GetResult|Error>((result: any) => {
                if (result === null) {
                    return [event, null];
                }
                return [event, result];
            })
            .catch((err: Error) => err);
    };
}

export function buildSetStateFn(kvStore: IKVStore, keyFn: KeyFn): SetStateFn {
    return (
        [event, oldState, newState]: ReduceResult,
    ): Promise<SetResult|Error> => {
        const key = keyFn(event);
        if (key === null) {
            return Promise.reject(
                new Error("[DP-L] Key could not be generated for event."),
            );
        }
        return kvStore.set(key, JSON.stringify(newState))
            .then<SetResult|Error>(() => {
                return [event, oldState, newState];
            })
            .catch((err: Error) => err);
    };
}
