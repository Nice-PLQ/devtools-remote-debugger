import * as Types from '../types/types.js';
export interface AnimationData {
    animations: readonly Types.TraceEvents.TraceEventAnimation[];
}
export declare function reset(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function data(): AnimationData;
