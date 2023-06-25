// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../models/trace/trace.js';
const SelectionRangeSymbol = Symbol('SelectionRange');
export class TimelineSelection {
    startTime;
    endTime;
    object;
    constructor(startTime, endTime, object) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.object = object;
    }
    static isFrameObject(object) {
        return object instanceof TimelineModel.TimelineFrameModel.TimelineFrame;
    }
    static fromFrame(frame) {
        return new TimelineSelection(TraceEngine.Types.Timing.MilliSeconds(frame.startTime), TraceEngine.Types.Timing.MilliSeconds(frame.endTime), frame);
    }
    static isNetworkRequestSelection(object) {
        return object instanceof TimelineModel.TimelineModel.NetworkRequest;
    }
    static fromNetworkRequest(request) {
        return new TimelineSelection(TraceEngine.Types.Timing.MilliSeconds(request.startTime), TraceEngine.Types.Timing.MilliSeconds(request.endTime || request.startTime), request);
    }
    static isTraceEventSelection(object) {
        if (object instanceof SDK.TracingModel.Event) {
            return true;
        }
        // Sadly new trace events are just raw objects, so now we have to confirm it is a trace event by ruling everything else out.
        if (TimelineSelection.isFrameObject(object) || TimelineSelection.isRangeSelection(object) ||
            TimelineSelection.isNetworkRequestSelection(object)) {
            return false;
        }
        return SDK.TracingModel.eventIsFromNewEngine(object);
    }
    static fromTraceEvent(event) {
        const { startTime, endTime } = SDK.TracingModel.timesForEventInMilliseconds(event);
        return new TimelineSelection(startTime, TraceEngine.Types.Timing.MilliSeconds(endTime || (startTime + 1)), event);
    }
    static isRangeSelection(object) {
        return object === SelectionRangeSymbol;
    }
    static fromRange(startTime, endTime) {
        return new TimelineSelection(TraceEngine.Types.Timing.MilliSeconds(startTime), TraceEngine.Types.Timing.MilliSeconds(endTime), SelectionRangeSymbol);
    }
}
//# sourceMappingURL=TimelineSelection.js.map