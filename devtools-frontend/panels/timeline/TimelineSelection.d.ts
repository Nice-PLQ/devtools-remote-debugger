import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../models/trace/trace.js';
type PermittedObjectTypes = TimelineModel.TimelineFrameModel.TimelineFrame | TimelineModel.TimelineModel.NetworkRequest | SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData | SelectionRange;
declare const SelectionRangeSymbol: unique symbol;
export type SelectionRange = typeof SelectionRangeSymbol;
export declare class TimelineSelection {
    readonly startTime: TraceEngine.Types.Timing.MilliSeconds;
    readonly endTime: TraceEngine.Types.Timing.MilliSeconds;
    readonly object: PermittedObjectTypes;
    constructor(startTime: TraceEngine.Types.Timing.MilliSeconds, endTime: TraceEngine.Types.Timing.MilliSeconds, object: PermittedObjectTypes);
    static isFrameObject(object: PermittedObjectTypes): object is TimelineModel.TimelineFrameModel.TimelineFrame;
    static fromFrame(frame: TimelineModel.TimelineFrameModel.TimelineFrame): TimelineSelection;
    static isNetworkRequestSelection(object: PermittedObjectTypes): object is TimelineModel.TimelineModel.NetworkRequest;
    static fromNetworkRequest(request: TimelineModel.TimelineModel.NetworkRequest): TimelineSelection;
    static isTraceEventSelection(object: PermittedObjectTypes): object is SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData;
    static fromTraceEvent(event: SDK.TracingModel.CompatibleTraceEvent): TimelineSelection;
    static isRangeSelection(object: PermittedObjectTypes): object is SelectionRange;
    static fromRange(startTime: number, endTime: number): TimelineSelection;
}
export {};
