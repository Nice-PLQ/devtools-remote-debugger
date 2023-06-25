import type * as Protocol from '../../../generated/protocol.js';
import { type MicroSeconds, type MilliSeconds, type Seconds } from './Timing.js';
export declare const enum Phase {
    BEGIN = "B",
    END = "E",
    COMPLETE = "X",
    INSTANT = "I",
    COUNTER = "C",
    ASYNC_NESTABLE_START = "b",
    ASYNC_NESTABLE_INSTANT = "n",
    ASYNC_NESTABLE_END = "e",
    ASYNC_STEP_INTO = "T",
    ASYNC_BEGIN = "S",
    ASYNC_END = "F",
    ASYNC_STEP_PAST = "p",
    FLOW_START = "s",
    FLOW_STEP = "t",
    FLOW_END = "f",
    SAMPLE = "P",
    OBJECT_CREATED = "N",
    OBJECT_SNAPSHOT = "O",
    OBJECT_DESTROYED = "D",
    METADATA = "M",
    MEMORY_DUMP_GLOBAL = "V",
    MEMORY_DUMP_PROCESS = "v",
    MARK = "R",
    CLOCK_SYNC = "c"
}
export declare function isNestableAsyncPhase(phase: Phase): boolean;
export declare function isAsyncPhase(phase: Phase): boolean;
export declare function isFlowPhase(phase: Phase): boolean;
export declare const enum TraceEventScope {
    THREAD = "t",
    PROCESS = "p",
    GLOBAL = "g"
}
export interface TraceEventData {
    args?: TraceEventArgs;
    cat: string;
    name: string;
    ph: Phase;
    pid: ProcessID;
    tid: ThreadID;
    tts?: MicroSeconds;
    ts: MicroSeconds;
    tdur?: MicroSeconds;
    dur?: MicroSeconds;
}
export interface TraceEventArgs {
    data?: TraceEventArgsData;
}
export interface TraceEventArgsData {
    stackTrace?: TraceEventCallFrame[];
    navigationId?: string;
    frame?: string;
}
export interface TraceEventCallFrame {
    codeType?: string;
    functionName: string;
    scriptId: number;
    columnNumber?: number;
    lineNumber?: number;
    url?: string;
}
export interface TraceFrame {
    frame: string;
    name: string;
    processId: ProcessID;
    url: string;
    parent?: string;
}
export interface TraceEventSample extends TraceEventData {
    ph: Phase.SAMPLE;
}
export interface TraceEventProfile extends TraceEventSample {
    name: 'Profile';
    id: ProfileID;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            startTime: MicroSeconds;
        };
    };
}
export interface TraceEventProfileChunk extends TraceEventSample {
    name: 'ProfileChunk';
    id: ProfileID;
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            cpuProfile?: TraceEventPartialProfile;
            timeDeltas?: MicroSeconds[];
        };
    };
}
export interface TraceEventPartialProfile {
    nodes?: TraceEventPartialNode[];
    samples: CallFrameID[];
}
export interface TraceEventPartialNode {
    callFrame: TraceEventCallFrame;
    id: CallFrameID;
    parent?: CallFrameID;
}
export interface TraceEventComplete extends TraceEventData {
    ph: Phase.COMPLETE;
    dur: MicroSeconds;
}
export interface TraceEventDispatch extends TraceEventComplete {
    name: 'EventDispatch';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            type: string;
        };
    };
}
export interface TraceEventEventTiming extends TraceEventData {
    ph: Phase.ASYNC_NESTABLE_START | Phase.ASYNC_NESTABLE_END;
    id: string;
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            cancelable: boolean;
            duration: MilliSeconds;
            processingEnd: MicroSeconds;
            processingStart: MicroSeconds;
            timeStamp: MicroSeconds;
            interactionId?: number;
            type: string;
        };
    };
}
export interface TraceEventEventTimingBegin extends TraceEventEventTiming {
    ph: Phase.ASYNC_NESTABLE_START;
}
export interface TraceEventEventTimingEnd extends TraceEventEventTiming {
    ph: Phase.ASYNC_NESTABLE_END;
}
export interface TraceEventGPUTask extends TraceEventComplete {
    name: 'GPUTask';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            renderer_pid: ProcessID;
            used_bytes: number;
        };
    };
}
export interface TraceEventSyntheticNetworkRedirect {
    url: string;
    priority: string;
    ts: MicroSeconds;
    dur: MicroSeconds;
}
export interface TraceEventSyntheticNetworkRequest extends TraceEventComplete {
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            decodedBodyLength: number;
            dnsLookup: MicroSeconds;
            download: MicroSeconds;
            encodedDataLength: number;
            finishTime: MicroSeconds;
            frame: string;
            fromCache: boolean;
            fromServiceWorker: boolean;
            host: string;
            initialConnection: MicroSeconds;
            isHttps: boolean;
            mimeType: string;
            networkDuration: MicroSeconds;
            pathname: string;
            search: string;
            priority: string;
            processingDuration: MicroSeconds;
            protocol: string;
            proxyNegotiation: MicroSeconds;
            queueing: MicroSeconds;
            receiveHeadersEnd: MicroSeconds;
            redirects: TraceEventSyntheticNetworkRedirect[];
            redirectionDuration: MicroSeconds;
            renderBlocking: RenderBlocking;
            requestId: string;
            requestingFrameUrl: string;
            requestSent: MicroSeconds;
            requestTime: number;
            sendEnd: MicroSeconds;
            sendStart: MicroSeconds;
            statusCode: number;
            ssl: MicroSeconds;
            sslStart: MicroSeconds;
            stalled: MicroSeconds;
            totalTime: MicroSeconds;
            url: string;
            waiting: MicroSeconds;
        };
    };
    cat: 'loading';
    name: 'SyntheticNetworkRequest';
    ph: Phase.COMPLETE;
    dur: MicroSeconds;
    tdur: MicroSeconds;
    ts: MicroSeconds;
    tts: MicroSeconds;
    pid: ProcessID;
    tid: ThreadID;
}
export interface TraceEventSnapshot extends TraceEventData {
    args: TraceEventArgs & {
        snapshot: string;
    };
    name: 'Screenshot';
    cat: 'disabled-by-default-devtools.screenshot';
    ph: Phase.OBJECT_SNAPSHOT;
}
export interface TraceEventAnimation extends TraceEventData {
    args: TraceEventArgs & {
        id?: string;
        name?: string;
        nodeId?: number;
        nodeName?: string;
        state?: string;
        compositeFailed?: number;
        unsupportedProperties?: string[];
    };
    name: 'Animation';
    id2?: {
        local?: string;
    };
}
export interface TraceEventMetadata extends TraceEventData {
    ph: Phase.METADATA;
    args: TraceEventArgs & {
        name?: string;
        uptime?: string;
    };
}
export interface TraceEventThreadName extends TraceEventMetadata {
    name: 'thread_name';
    args: TraceEventArgs & {
        name?: string;
    };
}
export interface TraceEventProcessName extends TraceEventMetadata {
    name: 'process_name';
}
export interface TraceEventMark extends TraceEventData {
    ph: Phase.MARK;
}
export interface TraceEventNavigationStart extends TraceEventMark {
    name: 'navigationStart';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            documentLoaderURL: string;
            isLoadingMainFrame: boolean;
            isOutermostMainFrame?: boolean;
            navigationId: string;
        };
        frame: string;
    };
}
export interface TraceEventFirstContentfulPaint extends TraceEventMark {
    name: 'firstContentfulPaint';
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            navigationId: string;
        };
    };
}
export interface TraceEventFirstPaint extends TraceEventMark {
    name: 'firstPaint';
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            navigationId: string;
        };
    };
}
export type PageLoadEvent = TraceEventFirstContentfulPaint | TraceEventMarkDOMContent | TraceEventInteractiveTime | TraceEventLargestContentfulPaintCandidate | TraceEventLayoutShift | TraceEventFirstPaint | TraceEventMarkLoad;
export interface TraceEventLargestContentfulPaintCandidate extends TraceEventMark {
    name: 'largestContentfulPaint::Candidate';
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            candidateIndex: number;
            isOutermostMainFrame: boolean;
            isMainFrame: boolean;
            navigationId: string;
            nodeId: Protocol.DOM.BackendNodeId;
            type?: string;
        };
    };
}
export interface TraceEventLargestImagePaintCandidate extends TraceEventMark {
    name: 'LargestImagePaint::Candidate';
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            candidateIndex: number;
            imageUrl: string;
            DOMNodeId: Protocol.DOM.BackendNodeId;
        };
    };
}
export interface TraceEventLargestTextPaintCandidate extends TraceEventMark {
    name: 'LargestTextPaint::Candidate';
    args: TraceEventArgs & {
        frame: string;
        data?: TraceEventArgsData & {
            candidateIndex: number;
            DOMNodeId: Protocol.DOM.BackendNodeId;
        };
    };
}
export interface TraceEventInteractiveTime extends TraceEventMark {
    name: 'InteractiveTime';
    args: TraceEventArgs & {
        args: {
            total_blocking_time_ms: number;
        };
        frame: string;
    };
}
export interface TraceEventInstant extends TraceEventData {
    ph: Phase.INSTANT;
    s: TraceEventScope;
}
export type TraceEventRendererData = TraceEventInstant | TraceEventComplete;
export interface TraceEventTracingStartedInBrowser extends TraceEventInstant {
    name: 'TracingStartedInBrowser';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            frameTreeNodeId: number;
            frames?: TraceFrame[];
            persistentIds: boolean;
        };
    };
}
export interface TraceEventFrameCommittedInBrowser extends TraceEventInstant {
    name: 'FrameCommittedInBrowser';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & TraceFrame;
    };
}
export interface TraceEventMainFrameViewport extends TraceEventInstant {
    name: 'PaintTimingVisualizer::Viewport';
    args: {
        data: TraceEventArgsData & {
            viewport_rect: number[];
        };
    };
}
export interface TraceEventCommitLoad extends TraceEventInstant {
    name: 'CommitLoad';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            frame: string;
            isMainFrame: boolean;
            name: string;
            nodeId: number;
            page: string;
            parent: string;
            url: string;
        };
    };
}
export interface TraceEventMarkDOMContent extends TraceEventInstant {
    name: 'MarkDOMContent';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            frame: string;
            isMainFrame: boolean;
            page: string;
        };
    };
}
export interface TraceEventMarkLoad extends TraceEventInstant {
    name: 'MarkLoad';
    args: TraceEventArgs & {
        data?: TraceEventArgsData & {
            frame: string;
            isMainFrame: boolean;
            page: string;
        };
    };
}
export interface TraceEventAsync extends TraceEventData {
    ph: Phase.ASYNC_NESTABLE_START | Phase.ASYNC_NESTABLE_INSTANT | Phase.ASYNC_NESTABLE_END | Phase.ASYNC_STEP_INTO | Phase.ASYNC_BEGIN | Phase.ASYNC_END | Phase.ASYNC_STEP_PAST;
}
export type TraceRect = [number, number, number, number];
export type TraceImpactedNode = {
    new_rect: TraceRect;
    node_id: Protocol.DOM.BackendNodeId;
    old_rect: TraceRect;
};
type LayoutShiftData = TraceEventArgsData & {
    cumulative_score: number;
    frame_max_distance: number;
    had_recent_input: boolean;
    impacted_nodes: TraceImpactedNode[] | undefined;
    is_main_frame: boolean;
    overall_max_distance: number;
    region_rects: TraceRect[];
    score: number;
    weighted_score_delta: number;
};
export interface TraceEventLayoutShift extends TraceEventInstant {
    name: 'LayoutShift';
    normalized?: boolean;
    args: TraceEventArgs & {
        frame: string;
        data?: LayoutShiftData;
    };
}
interface LayoutShiftSessionWindowData {
    cumulativeWindowScore: number;
    id: number;
}
export interface LayoutShiftParsedData {
    screenshotSource?: string;
    timeFromNavigation?: MicroSeconds;
    cumulativeWeightedScoreInWindow: number;
    sessionWindowData: LayoutShiftSessionWindowData;
}
export interface SyntheticLayoutShift extends TraceEventLayoutShift {
    args: TraceEventArgs & {
        frame: string;
        data?: LayoutShiftData & {
            rawEvent: TraceEventLayoutShift;
        };
    };
    parsedData: LayoutShiftParsedData;
}
export type Priorty = 'Low' | 'High' | 'VeryHigh' | 'Highest';
export type RenderBlocking = 'blocking' | 'non_blocking' | 'in_body_parser_blocking' | 'potentially_blocking';
export interface TraceEventResourceSendRequest extends TraceEventInstant {
    name: 'ResourceSendRequest';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            frame: string;
            requestId: string;
            url: string;
            priority: Priorty;
            renderBlocking?: RenderBlocking;
        };
    };
}
export interface TraceEventResourceWillSendRequest extends TraceEventInstant {
    name: 'ResourceWillSendRequest';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            requestId: string;
        };
    };
}
export interface TraceEventResourceFinish extends TraceEventInstant {
    name: 'ResourceFinish';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            decodedBodyLength: number;
            didFail: boolean;
            encodedDataLength: number;
            finishTime: Seconds;
            requestId: string;
        };
    };
}
export interface TraceEventResourceReceivedData extends TraceEventInstant {
    name: 'ResourceReceivedData';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            encodedDataLength: number;
            frame: string;
            requestId: string;
        };
    };
}
export interface TraceEventResourceReceiveResponse extends TraceEventInstant {
    name: 'ResourceReceiveResponse';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            encodedDataLength: number;
            frame: string;
            fromCache: boolean;
            fromServiceWorker: boolean;
            mimeType: string;
            requestId: string;
            responseTime: MilliSeconds;
            statusCode: number;
            timing: {
                connectEnd: MilliSeconds;
                connectStart: MilliSeconds;
                dnsEnd: MilliSeconds;
                dnsStart: MilliSeconds;
                proxyEnd: MilliSeconds;
                proxyStart: MilliSeconds;
                pushEnd: MilliSeconds;
                pushStart: MilliSeconds;
                receiveHeadersEnd: MilliSeconds;
                requestTime: number;
                sendEnd: MilliSeconds;
                sendStart: MilliSeconds;
                sslEnd: MilliSeconds;
                sslStart: MilliSeconds;
                workerReady: MilliSeconds;
                workerStart: MilliSeconds;
            };
        };
    };
}
export declare const enum LayoutInvalidationReason {
    SIZE_CHANGED = "Size changed",
    ATTRIBUTE = "Attribute",
    ADDED_TO_LAYOUT = "Added to layout",
    SCROLLBAR_CHANGED = "Scrollbar changed",
    REMOVED_FROM_LAYOUT = "Removed from layout",
    STYLE_CHANGED = "Style changed",
    FONTS_CHANGED = "Fonts changed",
    UNKNOWN = "Unknown"
}
export interface TraceEventLayoutInvalidation extends TraceEventInstant {
    name: 'LayoutInvalidationTracking' | 'ScheduleStyleInvalidationTracking';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            frame: string;
            nodeId: Protocol.DOM.BackendNodeId;
            reason: LayoutInvalidationReason;
            nodeName?: string;
        };
    };
}
export declare const enum StyleRecalcInvalidationReason {
    ANIMATION = "Animation"
}
export interface TraceEventStyleRecalcInvalidation extends TraceEventInstant {
    name: 'StyleRecalcInvalidationTracking';
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            frame: string;
            nodeId: Protocol.DOM.BackendNodeId;
            reason: StyleRecalcInvalidationReason;
            subtree: boolean;
            nodeName?: string;
            extraData?: string;
        };
    };
}
export interface TraceEventPrePaint extends TraceEventComplete {
    name: 'PrePaint';
}
export type TraceEventNestableAsync = TraceEventNestableAsyncBegin | TraceEventNestableAsyncEnd;
export interface TraceEventNestableAsyncBegin extends TraceEventData {
    ph: Phase.ASYNC_NESTABLE_START;
    id2?: {
        local?: string;
        global?: string;
    };
    id?: string;
}
export interface TraceEventNestableAsyncEnd extends TraceEventData {
    ph: Phase.ASYNC_NESTABLE_END;
    id2?: {
        local?: string;
        global?: string;
    };
    id?: string;
}
export type TraceEventAsyncPerformanceMeasure = TraceEventPerformanceMeasureBegin | TraceEventPerformanceMeasureEnd;
export interface TraceEventPerformanceMeasureBegin extends TraceEventNestableAsyncBegin {
    cat: 'blink.user_timing';
    id: string;
}
export interface TraceEventPerformanceMeasureEnd extends TraceEventNestableAsyncEnd {
    cat: 'blink.user_timing';
    id: string;
}
export interface TraceEventConsoleTimeBegin extends TraceEventNestableAsyncBegin {
    cat: 'blink.console';
    id2: {
        local: string;
    };
}
export interface TraceEventConsoleTimeEnd extends TraceEventNestableAsyncEnd {
    cat: 'blink.console';
    id2: {
        local: string;
    };
}
export interface TraceEventTimeStamp extends TraceEventData {
    cat: 'devtools.timeline';
    name: 'TimeStamp';
    ph: Phase.INSTANT;
    id: string;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            frame: string;
            message: string;
        };
    };
}
export interface TraceEventPerformanceMark extends TraceEventData {
    cat: 'blink.user_timing';
    ph: Phase.INSTANT | Phase.MARK;
    id: string;
}
export interface TraceEventSyntheticNestableAsyncEvent extends TraceEventData {
    id?: string;
    id2?: {
        local?: string;
        global?: string;
    };
    dur: MicroSeconds;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            beginEvent: TraceEventNestableAsyncBegin;
            endEvent: TraceEventNestableAsyncEnd;
        };
    };
}
export interface TraceEventSyntheticUserTiming extends TraceEventSyntheticNestableAsyncEvent {
    id: string;
    dur: MicroSeconds;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            beginEvent: TraceEventPerformanceMeasureBegin;
            endEvent: TraceEventPerformanceMeasureEnd;
        };
    };
}
export interface TraceEventSyntheticConsoleTiming extends TraceEventSyntheticNestableAsyncEvent {
    id2: {
        local: string;
    };
    dur: MicroSeconds;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            beginEvent: TraceEventConsoleTimeBegin;
            endEvent: TraceEventConsoleTimeEnd;
        };
    };
}
export interface SyntheticInteractionEvent extends TraceEventSyntheticNestableAsyncEvent {
    interactionId: number;
    type: string;
    ts: MicroSeconds;
    dur: MicroSeconds;
    args: TraceEventArgs & {
        data: TraceEventArgsData & {
            beginEvent: TraceEventEventTimingBegin;
            endEvent: TraceEventEventTimingEnd;
        };
    };
}
export declare function isSyntheticInteractionEvent(event: TraceEventData): event is SyntheticInteractionEvent;
declare class ProfileIdTag {
    #private;
}
export type ProfileID = string & ProfileIdTag;
export declare function ProfileID(value: string): ProfileID;
declare class CallFrameIdTag {
    #private;
}
export type CallFrameID = number & CallFrameIdTag;
export declare function CallFrameID(value: number): CallFrameID;
declare class ProcessIdTag {
    #private;
}
export type ProcessID = number & ProcessIdTag;
export declare function ProcessID(value: number): ProcessID;
declare class ThreadIdTag {
    #private;
}
export type ThreadID = number & ThreadIdTag;
export declare function ThreadID(value: number): ThreadID;
export declare function isTraceEventComplete(event: TraceEventData): event is TraceEventComplete;
export declare function isTraceEventDispatch(event: TraceEventData): event is TraceEventDispatch;
export declare function isTraceEventInstant(event: TraceEventData): event is TraceEventInstant;
export declare function isTraceEventRendererEvent(event: TraceEventData): event is TraceEventRendererData;
export declare function isThreadName(traceEventData: TraceEventData): traceEventData is TraceEventThreadName;
export declare function isProcessName(traceEventData: TraceEventData): traceEventData is TraceEventProcessName;
export declare function isTraceEventTracingStartedInBrowser(traceEventData: TraceEventData): traceEventData is TraceEventTracingStartedInBrowser;
export declare function isTraceEventFrameCommittedInBrowser(traceEventData: TraceEventData): traceEventData is TraceEventFrameCommittedInBrowser;
export declare function isTraceEventCommitLoad(traceEventData: TraceEventData): traceEventData is TraceEventCommitLoad;
export declare function isTraceEventNavigationStart(traceEventData: TraceEventData): traceEventData is TraceEventNavigationStart;
export declare function isTraceEventAnimation(traceEventData: TraceEventData): traceEventData is TraceEventAnimation;
export declare function isTraceEventLayoutShift(traceEventData: TraceEventData): traceEventData is TraceEventLayoutShift;
export declare function isTraceEventLayoutInvalidation(traceEventData: TraceEventData): traceEventData is TraceEventLayoutInvalidation;
export declare function isTraceEventStyleRecalcInvalidation(traceEventData: TraceEventData): traceEventData is TraceEventStyleRecalcInvalidation;
export declare function isTraceEventFirstContentfulPaint(traceEventData: TraceEventData): traceEventData is TraceEventFirstContentfulPaint;
export declare function isTraceEventLargestContentfulPaintCandidate(traceEventData: TraceEventData): traceEventData is TraceEventLargestContentfulPaintCandidate;
export declare function isTraceEventLargestImagePaintCandidate(traceEventData: TraceEventData): traceEventData is TraceEventLargestImagePaintCandidate;
export declare function isTraceEventLargestTextPaintCandidate(traceEventData: TraceEventData): traceEventData is TraceEventLargestTextPaintCandidate;
export declare function isTraceEventMarkLoad(traceEventData: TraceEventData): traceEventData is TraceEventMarkLoad;
export declare function isTraceEventFirstPaint(traceEventData: TraceEventData): traceEventData is TraceEventFirstPaint;
export declare function isTraceEventMarkDOMContent(traceEventData: TraceEventData): traceEventData is TraceEventMarkDOMContent;
export declare function isTraceEventInteractiveTime(traceEventData: TraceEventData): traceEventData is TraceEventInteractiveTime;
export declare function isTraceEventEventTiming(traceEventData: TraceEventData): traceEventData is TraceEventEventTiming;
export declare function isTraceEventEventTimingEnd(traceEventData: TraceEventData): traceEventData is TraceEventEventTimingEnd;
export declare function isTraceEventEventTimingStart(traceEventData: TraceEventData): traceEventData is TraceEventEventTimingBegin;
export declare function isTraceEventGPUTask(traceEventData: TraceEventData): traceEventData is TraceEventGPUTask;
export declare function isTraceEventProfile(traceEventData: TraceEventData): traceEventData is TraceEventProfile;
export declare function isTraceEventProfileChunk(traceEventData: TraceEventData): traceEventData is TraceEventProfileChunk;
export declare function isTraceEventResourceSendRequest(traceEventData: TraceEventData): traceEventData is TraceEventResourceSendRequest;
export declare function isTraceEventResourceReceiveResponse(traceEventData: TraceEventData): traceEventData is TraceEventResourceReceiveResponse;
export declare function isTraceEventResourceFinish(traceEventData: TraceEventData): traceEventData is TraceEventResourceFinish;
export declare function isTraceEventResourceWillSendRequest(traceEventData: TraceEventData): traceEventData is TraceEventResourceWillSendRequest;
export declare function isTraceEventResourceReceivedData(traceEventData: TraceEventData): traceEventData is TraceEventResourceReceivedData;
export declare function isSyntheticNetworkRequestDetailsEvent(traceEventData: TraceEventData): traceEventData is TraceEventSyntheticNetworkRequest;
export declare function isTraceEventPrePaint(traceEventData: TraceEventData): traceEventData is TraceEventPrePaint;
export declare function isTraceEventNavigationStartWithURL(event: TraceEventData): event is TraceEventNavigationStart;
export declare function isTraceEventMainFrameViewport(traceEventData: TraceEventData): traceEventData is TraceEventMainFrameViewport;
export declare function isSyntheticUserTimingTraceEvent(traceEventData: TraceEventData): traceEventData is TraceEventSyntheticUserTiming;
export declare function isSyntheticConsoleTimingTraceEvent(traceEventData: TraceEventData): traceEventData is TraceEventSyntheticConsoleTiming;
export declare function isTraceEventPerformanceMeasure(traceEventData: TraceEventData): traceEventData is TraceEventPerformanceMeasureBegin | TraceEventPerformanceMeasureEnd;
export declare function isTraceEventPerformanceMark(traceEventData: TraceEventData): traceEventData is TraceEventPerformanceMark;
export declare function isTraceEventConsoleTime(traceEventData: TraceEventData): traceEventData is TraceEventConsoleTimeBegin | TraceEventConsoleTimeEnd;
export declare function isTraceEventTimeStamp(traceEventData: TraceEventData): traceEventData is TraceEventTimeStamp;
export interface TraceEventAsync extends TraceEventData {
    ph: Phase.ASYNC_NESTABLE_START | Phase.ASYNC_NESTABLE_INSTANT | Phase.ASYNC_NESTABLE_END | Phase.ASYNC_STEP_INTO | Phase.ASYNC_BEGIN | Phase.ASYNC_END | Phase.ASYNC_STEP_PAST;
}
export declare function isTraceEventAsyncPhase(traceEventData: TraceEventData): boolean;
export declare function isSyntheticLayoutShift(traceEventData: TraceEventData): traceEventData is SyntheticLayoutShift;
export {};
