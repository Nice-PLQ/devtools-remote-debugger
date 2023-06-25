import { type EventPayload } from './TracingManager.js';
import * as TraceEngine from '../../models/trace/trace.js';
export declare class TracingModel {
    #private;
    constructor(title?: string);
    static isTopLevelEvent(event: CompatibleTraceEvent): boolean;
    static extractId(payload: EventPayload): string | undefined;
    static browserMainThread(tracingModel: TracingModel): Thread | null;
    allRawEvents(): readonly EventPayload[];
    devToolsMetadataEvents(): Event[];
    addEvents(events: readonly EventPayload[]): void;
    tracingComplete(): void;
    private addEvent;
    private addSampleEvent;
    profileGroup(event: Event): ProfileEventsGroup | null;
    minimumRecordTime(): number;
    maximumRecordTime(): number;
    navStartTimes(): Map<string, PayloadEvent>;
    sortedProcesses(): Process[];
    getProcessByName(name: string): Process | null;
    getProcessById(pid: number): Process | null;
    getThreadByName(processName: string, threadName: string): Thread | null;
    private processPendingAsyncEvents;
    private closeOpenAsyncEvents;
    private addNestableAsyncEvent;
    private addAsyncEvent;
    title(): string | undefined;
    parsedCategoriesForString(str: string): Set<string>;
}
export declare const eventPhasesOfInterestForTraceBounds: Set<TraceEngine.Types.TraceEvents.Phase>;
export declare const MetadataEvent: {
    ProcessSortIndex: string;
    ProcessName: string;
    ThreadSortIndex: string;
    ThreadName: string;
};
export declare const LegacyTopLevelEventCategory = "toplevel";
export declare const DevToolsMetadataEventCategory = "disabled-by-default-devtools.timeline";
export declare const DevToolsTimelineEventCategory = "disabled-by-default-devtools.timeline";
export declare function eventHasPayload(event: Event): event is PayloadEvent;
export declare class Event {
    #private;
    categoriesString: string;
    name: string;
    phase: TraceEngine.Types.TraceEvents.Phase;
    startTime: number;
    thread: Thread;
    args: any;
    id: string | null;
    ordinal: number;
    selfTime: number;
    endTime?: number;
    duration?: number;
    protected constructor(categories: string | undefined, name: string, phase: TraceEngine.Types.TraceEvents.Phase, startTime: number, thread: Thread);
    static compareStartTime(a: Event | null, b: Event | null): number;
    static orderedCompareStartTime(a: Event, b: Event): number;
    hasCategory(categoryName: string): boolean;
    setEndTime(endTime: number): void;
    addArgs(args: any): void;
    complete(endEvent: Event): void;
}
/**
 * Represents a tracing event that is not directly linked to an individual
 * object in the trace. We construct these events at times, particularly when
 * building up the CPU profile data for JS Profiling.
 **/
export declare class ConstructedEvent extends Event {
    constructor(categories: string | undefined, name: string, phase: TraceEngine.Types.TraceEvents.Phase, startTime: number, thread: Thread);
}
/**
 * Represents a tracing event that has been created directly from an object in
 * the trace file and therefore is guaranteed to have a payload associated with
 * it. The only way to create these events is to use the static fromPayload
 * method, which you must call with a payload.
 **/
export declare class PayloadEvent extends Event {
    #private;
    /**
     * Returns the raw payload that was used to create this event instance.
     **/
    rawLegacyPayload(): EventPayload;
    /**
     * Returns the raw payload that was used to create this event instance, but
     * returns it typed as the new engine's TraceEventArgs option.
     **/
    rawPayload(): TraceEngine.Types.TraceEvents.TraceEventData;
    protected constructor(categories: string | undefined, name: string, phase: TraceEngine.Types.TraceEvents.Phase, startTime: number, thread: Thread, rawPayload: EventPayload);
    static fromPayload(payload: EventPayload, thread: Thread): PayloadEvent;
}
export declare class ObjectSnapshot extends PayloadEvent {
    private constructor();
    static fromPayload(payload: EventPayload, thread: Thread): ObjectSnapshot;
    getSnapshot(): ObjectSnapshot;
}
export declare class AsyncEvent extends ConstructedEvent {
    steps: Event[];
    causedFrame: boolean;
    constructor(startEvent: Event);
    addStep(event: Event): void;
}
declare class ProfileEventsGroup {
    children: Event[];
    constructor(event: Event);
    addChild(event: Event): void;
}
declare class NamedObject {
    #private;
    model: TracingModel;
    readonly idInternal: number;
    constructor(model: TracingModel, id: number);
    static sort<Item extends NamedObject>(array: Item[]): Item[];
    setName(name: string): void;
    name(): string;
    id(): number;
    setSortIndex(sortIndex: number): void;
    getModel(): TracingModel;
}
export declare class Process extends NamedObject {
    #private;
    readonly threads: Map<number, Thread>;
    constructor(model: TracingModel, id: number);
    threadById(id: number): Thread;
    threadByName(name: string): Thread | null;
    setThreadByName(name: string, thread: Thread): void;
    addEvent(payload: EventPayload): Event | null;
    sortedThreads(): Thread[];
}
export declare class Thread extends NamedObject {
    #private;
    constructor(process: Process, id: number);
    tracingComplete(): void;
    addEvent(payload: EventPayload): Event | null;
    addAsyncEvent(asyncEvent: AsyncEvent): void;
    setName(name: string): void;
    process(): Process;
    events(): Event[];
    asyncEvents(): AsyncEvent[];
    removeEventsByName(name: string): Event[];
}
export interface TimesForEventMs {
    startTime: TraceEngine.Types.Timing.MilliSeconds;
    endTime?: TraceEngine.Types.Timing.MilliSeconds;
    selfTime: TraceEngine.Types.Timing.MilliSeconds;
    duration: TraceEngine.Types.Timing.MilliSeconds;
}
export declare function timesForEventInMilliseconds(event: Event | TraceEngine.Types.TraceEvents.TraceEventData): TimesForEventMs;
export declare function eventHasCategory(event: CompatibleTraceEvent, category: string): boolean;
export declare function phaseForEvent(event: Event | TraceEngine.Types.TraceEvents.TraceEventData): TraceEngine.Types.TraceEvents.Phase;
export declare function threadIDForEvent(event: Event | TraceEngine.Types.TraceEvents.TraceEventData): TraceEngine.Types.TraceEvents.ThreadID;
export declare function eventIsFromNewEngine(event: CompatibleTraceEvent | null): event is TraceEngine.Types.TraceEvents.TraceEventData;
export type CompatibleTraceEvent = Event | TraceEngine.Types.TraceEvents.TraceEventData;
export {};
