import { type TraceEventHandlerName } from './types.js';
import * as Types from '../types/types.js';
interface NetworkRequestData {
    byOrigin: Map<string, {
        renderBlocking: Types.TraceEvents.TraceEventSyntheticNetworkRequest[];
        nonRenderBlocking: Types.TraceEvents.TraceEventSyntheticNetworkRequest[];
        all: Types.TraceEvents.TraceEventSyntheticNetworkRequest[];
    }>;
    byTime: Types.TraceEvents.TraceEventSyntheticNetworkRequest[];
}
export declare function reset(): void;
export declare function initialize(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function finalize(): Promise<void>;
export declare function data(): NetworkRequestData;
export declare function deps(): TraceEventHandlerName[];
export {};
