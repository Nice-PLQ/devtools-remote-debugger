import * as Types from '../types/types.js';
export declare function reset(): void;
export declare function initialize(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function finalize(): Promise<void>;
type MetaHandlerData = {
    traceBounds: Types.Timing.TraceWindow;
    browserProcessId: Types.TraceEvents.ProcessID;
    browserThreadId: Types.TraceEvents.ThreadID;
    gpuProcessId: Types.TraceEvents.ProcessID;
    gpuThreadId?: Types.TraceEvents.ThreadID;
    viewportRect?: DOMRect;
    navigationsByFrameId: Map<string, Types.TraceEvents.TraceEventNavigationStart[]>;
    navigationsByNavigationId: Map<string, Types.TraceEvents.TraceEventNavigationStart>;
    threadsInProcess: Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventThreadName>>;
    mainFrameId: string;
    mainFrameURL: string;
    rendererProcessesByFrame: Map<string, Map<Types.TraceEvents.ProcessID, {
        frame: Types.TraceEvents.TraceFrame;
        window: Types.Timing.TraceWindow;
    }>>;
    topLevelRendererIds: Set<Types.TraceEvents.ProcessID>;
};
export declare function data(): MetaHandlerData;
export {};
