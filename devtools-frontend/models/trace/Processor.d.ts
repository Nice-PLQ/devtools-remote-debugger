import type * as Types from './types/types.js';
import * as Handlers from './handlers/handlers.js';
export type TraceParseEventProgressData = {
    index: number;
    total: number;
};
export declare class TraceParseProgressEvent extends Event {
    data: TraceParseEventProgressData;
    static readonly eventName = "traceparseprogress";
    constructor(data: TraceParseEventProgressData, init?: EventInit);
}
declare global {
    interface HTMLElementEventMap {
        [TraceParseProgressEvent.eventName]: TraceParseProgressEvent;
    }
}
export declare class TraceProcessor<EnabledModelHandlers extends {
    [key: string]: Handlers.Types.TraceEventHandler;
}> extends EventTarget {
    #private;
    static createWithAllHandlers(): TraceProcessor<typeof Handlers.ModelHandlers>;
    constructor(traceHandlers: EnabledModelHandlers, { pauseDuration, eventsPerChunk }?: {
        pauseDuration?: number | undefined;
        eventsPerChunk?: number | undefined;
    });
    reset(): void;
    parse(traceEvents: readonly Types.TraceEvents.TraceEventData[], freshRecording?: boolean): Promise<void>;
    get data(): Handlers.Types.EnabledHandlerDataWithMeta<EnabledModelHandlers> | null;
}
/**
 * Some Handlers need data provided by others. Dependencies of a handler handler are
 * declared in the `deps` field.
 * @returns A map from trace event handler name to trace event hander whose entries
 * iterate in such a way that each handler is visited after its dependencies.
 */
export declare function sortHandlers(traceHandlers: Partial<{
    [key in Handlers.Types.TraceEventHandlerName]: Handlers.Types.TraceEventHandler;
}>): Map<Handlers.Types.TraceEventHandlerName, Handlers.Types.TraceEventHandler>;
