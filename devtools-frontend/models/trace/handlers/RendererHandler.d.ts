import { KnownEventName, type TraceEventHandlerName } from './types.js';
import * as Types from '../types/types.js';
export declare function reset(): void;
export declare function initialize(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function finalize(): Promise<void>;
export declare function data(): RendererHandlerData;
/**
 * Steps through all the renderer processes we've located so far in the meta
 * handler, obtaining their URL, checking whether they are the main frame, and
 * collecting each one of their threads' name. This meta handler's data is
 * assigned to the renderer handler's data.
 */
export declare function assignMeta(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>, mainFrameId: string, rendererProcessesByFrame: Map<string, Map<Types.TraceEvents.ProcessID, {
    frame: Types.TraceEvents.TraceFrame;
}>>, threadsInProcess: Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventThreadName>>): void;
/**
 * Assigns origins to all threads in all processes.
 * @see assignMeta
 */
export declare function assignOrigin(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>, mainFrameId: string, rendererProcessesByFrame: Map<string, Map<Types.TraceEvents.ProcessID, {
    frame: Types.TraceEvents.TraceFrame;
}>>): void;
/**
 * Assigns whether or not a thread is the main frame to all threads in all processes.
 * @see assignMeta
 */
export declare function assignIsMainFrame(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>, mainFrameId: string, rendererProcessesByFrame: Map<string, Map<Types.TraceEvents.ProcessID, {
    frame: Types.TraceEvents.TraceFrame;
}>>): void;
/**
 * Assigns the thread name to all threads in all processes.
 * @see assignMeta
 */
export declare function assignThreadName(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>, rendererProcessesByFrame: Map<string, Map<Types.TraceEvents.ProcessID, {
    frame: Types.TraceEvents.TraceFrame;
}>>, threadsInProcess: Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventThreadName>>): void;
/**
 * Removes unneeded trace data opportunistically stored while handling events.
 * This currently does the following:
 *  - Deletes processes with an unkonwn origin.
 */
export declare function sanitizeProcesses(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>): void;
/**
 * Removes unneeded trace data opportunistically stored while handling events.
 * This currently does the following:
 *  - Deletes threads with no roots.
 */
export declare function sanitizeThreads(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>): void;
/**
 * Creates a hierarchical structure from the trace events. Each thread in each
 * process will contribute to their own individual hierarchy.
 *
 * The trace data comes in as a contiguous array of events, against which we
 * make a couple of assumptions:
 *
 *  1. Events are temporally-ordered in terms of start time (though they're
 *     not necessarily ordered as such in the data stream).
 *  2. If event B's start and end times are within event A's time boundaries
 *     we assume that A is the parent of B.
 *
 * Therefore we expect to reformulate something like:
 *
 * [ Task A ][ Task B ][ Task C ][ Task D ][ Task E ]
 *
 * Into something hierarchically-arranged like below:
 *
 * |------------- Task A -------------||-- Task E --|
 *  |-- Task B --||-- Task D --|
 *   |- Task C -|
 */
export declare function buildHierarchy(processes: Map<Types.TraceEvents.ProcessID, RendererProcess>, options: {
    filter: {
        has: (name: KnownEventName) => boolean;
    };
}): void;
/**
 * Builds a hierarchy of the trace events in a particular thread of a
 * particular process, assuming that they're sorted, by iterating through all of
 * the events in order.
 *
 * The approach is analogous to how a parser would be implemented. A stack
 * maintains local context. A scanner peeks and pops from the data stream.
 * Various "tokens" (events) are treated as "whitespace" (ignored).
 *
 * The tree starts out empty and is populated as the hierarchy is built. The
 * nodes are also assumed to be created empty, with no known parent or children.
 *
 * Complexity: O(n), where n = number of events
 */
export declare function treify(events: RendererTraceEvent[], options: {
    filter: {
        has: (name: KnownEventName) => boolean;
    };
}): RendererEventTree;
export declare const FORCED_LAYOUT_EVENT_NAMES: Set<KnownEventName>;
export declare const FORCED_RECALC_STYLE_EVENTS: Set<KnownEventName>;
export declare function deps(): TraceEventHandlerName[];
export interface RendererHandlerData {
    processes: Map<Types.TraceEvents.ProcessID, RendererProcess>;
    traceEventToNode: Map<RendererTraceEvent, RendererEventNode>;
    allRendererEvents: RendererTraceEvent[];
}
export interface RendererProcess {
    url: string | null;
    isOnMainFrame: boolean;
    threads: Map<Types.TraceEvents.ThreadID, RendererThread>;
}
export interface RendererThread {
    name: string | null;
    events: RendererTraceEvent[];
    tree?: RendererEventTree;
}
interface RendererEventData {
    selfTime: Types.Timing.MicroSeconds;
    initiator: RendererTraceEvent;
    parent?: RendererTraceEvent;
    hotFunctionsStackTraces: Types.TraceEvents.TraceEventCallFrame[][];
}
export type RendererTraceEvent = Types.TraceEvents.TraceEventRendererData & Partial<RendererEventData>;
export interface RendererEventTree {
    nodes: Map<RendererEventNodeId, RendererEventNode>;
    roots: Set<RendererEventNodeId>;
    maxDepth: number;
}
export interface RendererEventNode {
    event: RendererTraceEvent;
    depth: number;
    id: RendererEventNodeId;
    parentId?: RendererEventNodeId | null;
    childrenIds: Set<RendererEventNodeId>;
}
declare class RendererEventNodeIdTag {
    #private;
}
export type RendererEventNodeId = number & RendererEventNodeIdTag;
export {};
