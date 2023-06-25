// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export function isNestableAsyncPhase(phase) {
    return phase === "b" /* Phase.ASYNC_NESTABLE_START */ || phase === "e" /* Phase.ASYNC_NESTABLE_END */ ||
        phase === "n" /* Phase.ASYNC_NESTABLE_INSTANT */;
}
export function isAsyncPhase(phase) {
    return isNestableAsyncPhase(phase) || phase === "S" /* Phase.ASYNC_BEGIN */ || phase === "T" /* Phase.ASYNC_STEP_INTO */ ||
        phase === "F" /* Phase.ASYNC_END */ || phase === "p" /* Phase.ASYNC_STEP_PAST */;
}
export function isFlowPhase(phase) {
    return phase === "s" /* Phase.FLOW_START */ || phase === "t" /* Phase.FLOW_STEP */ || phase === "f" /* Phase.FLOW_END */;
}
export function isSyntheticInteractionEvent(event) {
    return Boolean('interactionId' in event && event.args?.data && 'beginEvent' in event.args.data && 'endEvent' in event.args.data);
}
class ProfileIdTag {
    #profileIdTag;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ProfileID(value) {
    return value;
}
class CallFrameIdTag {
    #callFrameIdTag;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function CallFrameID(value) {
    return value;
}
class ProcessIdTag {
    #processIdTag;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ProcessID(value) {
    return value;
}
class ThreadIdTag {
    #threadIdTag;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ThreadID(value) {
    return value;
}
export function isTraceEventComplete(event) {
    return event.ph === "X" /* Phase.COMPLETE */;
}
export function isTraceEventDispatch(event) {
    return event.name === 'EventDispatch';
}
export function isTraceEventInstant(event) {
    return event.ph === "I" /* Phase.INSTANT */;
}
export function isTraceEventRendererEvent(event) {
    return isTraceEventInstant(event) || isTraceEventComplete(event);
}
export function isThreadName(traceEventData) {
    return traceEventData.name === 'thread_name';
}
export function isProcessName(traceEventData) {
    return traceEventData.name === 'process_name';
}
export function isTraceEventTracingStartedInBrowser(traceEventData) {
    return traceEventData.name === 'TracingStartedInBrowser';
}
export function isTraceEventFrameCommittedInBrowser(traceEventData) {
    return traceEventData.name === 'FrameCommittedInBrowser';
}
export function isTraceEventCommitLoad(traceEventData) {
    return traceEventData.name === 'CommitLoad';
}
export function isTraceEventNavigationStart(traceEventData) {
    return traceEventData.name === 'navigationStart';
}
export function isTraceEventAnimation(traceEventData) {
    return traceEventData.name === 'Animation';
}
export function isTraceEventLayoutShift(traceEventData) {
    return traceEventData.name === 'LayoutShift';
}
export function isTraceEventLayoutInvalidation(traceEventData) {
    return traceEventData.name === 'LayoutInvalidationTracking' ||
        traceEventData.name === 'ScheduleStyleInvalidationTracking';
}
export function isTraceEventStyleRecalcInvalidation(traceEventData) {
    return traceEventData.name === 'StyleRecalcInvalidationTracking';
}
export function isTraceEventFirstContentfulPaint(traceEventData) {
    return traceEventData.name === 'firstContentfulPaint';
}
export function isTraceEventLargestContentfulPaintCandidate(traceEventData) {
    return traceEventData.name === 'largestContentfulPaint::Candidate';
}
export function isTraceEventLargestImagePaintCandidate(traceEventData) {
    return traceEventData.name === 'LargestImagePaint::Candidate';
}
export function isTraceEventLargestTextPaintCandidate(traceEventData) {
    return traceEventData.name === 'LargestTextPaint::Candidate';
}
export function isTraceEventMarkLoad(traceEventData) {
    return traceEventData.name === 'MarkLoad';
}
export function isTraceEventFirstPaint(traceEventData) {
    return traceEventData.name === 'firstPaint';
}
export function isTraceEventMarkDOMContent(traceEventData) {
    return traceEventData.name === 'MarkDOMContent';
}
export function isTraceEventInteractiveTime(traceEventData) {
    return traceEventData.name === 'InteractiveTime';
}
export function isTraceEventEventTiming(traceEventData) {
    return traceEventData.name === 'EventTiming';
}
export function isTraceEventEventTimingEnd(traceEventData) {
    return isTraceEventEventTiming(traceEventData) && traceEventData.ph === "e" /* Phase.ASYNC_NESTABLE_END */;
}
export function isTraceEventEventTimingStart(traceEventData) {
    return isTraceEventEventTiming(traceEventData) && traceEventData.ph === "b" /* Phase.ASYNC_NESTABLE_START */;
}
export function isTraceEventGPUTask(traceEventData) {
    return traceEventData.name === 'GPUTask';
}
export function isTraceEventProfile(traceEventData) {
    return traceEventData.name === 'Profile';
}
export function isTraceEventProfileChunk(traceEventData) {
    return traceEventData.name === 'ProfileChunk';
}
export function isTraceEventResourceSendRequest(traceEventData) {
    return traceEventData.name === 'ResourceSendRequest';
}
export function isTraceEventResourceReceiveResponse(traceEventData) {
    return traceEventData.name === 'ResourceReceiveResponse';
}
export function isTraceEventResourceFinish(traceEventData) {
    return traceEventData.name === 'ResourceFinish';
}
export function isTraceEventResourceWillSendRequest(traceEventData) {
    return traceEventData.name === 'ResourceWillSendRequest';
}
export function isTraceEventResourceReceivedData(traceEventData) {
    return traceEventData.name === 'ResourceReceivedData';
}
export function isSyntheticNetworkRequestDetailsEvent(traceEventData) {
    return traceEventData.name === 'SyntheticNetworkRequest';
}
export function isTraceEventPrePaint(traceEventData) {
    return traceEventData.name === 'PrePaint';
}
export function isTraceEventNavigationStartWithURL(event) {
    return Boolean(isTraceEventNavigationStart(event) && event.args.data && event.args.data.documentLoaderURL !== '');
}
export function isTraceEventMainFrameViewport(traceEventData) {
    return traceEventData.name === 'PaintTimingVisualizer::Viewport';
}
export function isSyntheticUserTimingTraceEvent(traceEventData) {
    if (traceEventData.cat !== 'blink.user_timing') {
        return false;
    }
    const data = traceEventData.args?.data;
    if (!data) {
        return false;
    }
    return 'beginEvent' in data && 'endEvent' in data;
}
export function isSyntheticConsoleTimingTraceEvent(traceEventData) {
    if (traceEventData.cat !== 'blink.console') {
        return false;
    }
    const data = traceEventData.args?.data;
    if (!data) {
        return false;
    }
    return 'beginEvent' in data && 'endEvent' in data;
}
export function isTraceEventPerformanceMeasure(traceEventData) {
    return isTraceEventAsyncPhase(traceEventData) && traceEventData.cat === 'blink.user_timing';
}
export function isTraceEventPerformanceMark(traceEventData) {
    return (traceEventData.ph === "R" /* Phase.MARK */ || traceEventData.ph === "I" /* Phase.INSTANT */) &&
        traceEventData.cat === 'blink.user_timing';
}
export function isTraceEventConsoleTime(traceEventData) {
    return isTraceEventAsyncPhase(traceEventData) && traceEventData.cat === 'blink.console';
}
export function isTraceEventTimeStamp(traceEventData) {
    return traceEventData.ph === "I" /* Phase.INSTANT */ && traceEventData.name === 'TimeStamp';
}
export function isTraceEventAsyncPhase(traceEventData) {
    const asyncPhases = new Set([
        "b" /* Phase.ASYNC_NESTABLE_START */,
        "n" /* Phase.ASYNC_NESTABLE_INSTANT */,
        "e" /* Phase.ASYNC_NESTABLE_END */,
        "T" /* Phase.ASYNC_STEP_INTO */,
        "S" /* Phase.ASYNC_BEGIN */,
        "F" /* Phase.ASYNC_END */,
        "p" /* Phase.ASYNC_STEP_PAST */,
    ]);
    return asyncPhases.has(traceEventData.ph);
}
export function isSyntheticLayoutShift(traceEventData) {
    if (!isTraceEventLayoutShift(traceEventData) || !traceEventData.args.data) {
        return false;
    }
    return 'rawEvent' in traceEventData.args.data;
}
//# sourceMappingURL=TraceEvents.js.map