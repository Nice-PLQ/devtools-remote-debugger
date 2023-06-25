// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../../../core/platform/platform.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';
/**
 * IMPORTANT!
 * See UserTimings.md in this directory for some handy documentation on
 * UserTimings and the trace events we parse currently.
 **/
const syntheticEvents = [];
const performanceMeasureEvents = [];
const performanceMarkEvents = [];
const consoleTimings = [];
const timestampEvents = [];
let handlerState = 1 /* HandlerState.UNINITIALIZED */;
export function reset() {
    syntheticEvents.length = 0;
    performanceMeasureEvents.length = 0;
    performanceMarkEvents.length = 0;
    consoleTimings.length = 0;
    timestampEvents.length = 0;
    handlerState = 2 /* HandlerState.INITIALIZED */;
}
const resourceTimingNames = [
    'workerStart',
    'redirectStart',
    'redirectEnd',
    'fetchStart',
    'domainLookupStart',
    'domainLookupEnd',
    'connectStart',
    'connectEnd',
    'secureConnectionStart',
    'requestStart',
    'responseStart',
    'responseEnd',
];
const navTimingNames = [
    'navigationStart',
    'unloadEventStart',
    'unloadEventEnd',
    'redirectStart',
    'redirectEnd',
    'fetchStart',
    'commitNavigationEnd',
    'domainLookupStart',
    'domainLookupEnd',
    'connectStart',
    'connectEnd',
    'secureConnectionStart',
    'requestStart',
    'responseStart',
    'responseEnd',
    'domLoading',
    'domInteractive',
    'domContentLoadedEventStart',
    'domContentLoadedEventEnd',
    'domComplete',
    'loadEventStart',
    'loadEventEnd',
];
export function handleEvent(event) {
    if (handlerState !== 2 /* HandlerState.INITIALIZED */) {
        throw new Error('UserTimings handler is not initialized');
    }
    // These are events dispatched under the blink.user_timing category
    // but that the user didn't add. Filter them out so that they do not
    // Appear in the timings track (they still appear in the main thread
    // flame chart).
    const ignoredNames = [...resourceTimingNames, ...navTimingNames];
    if (ignoredNames.includes(event.name)) {
        return;
    }
    if (Types.TraceEvents.isTraceEventPerformanceMeasure(event)) {
        performanceMeasureEvents.push(event);
        return;
    }
    if (Types.TraceEvents.isTraceEventPerformanceMark(event)) {
        performanceMarkEvents.push(event);
    }
    if (Types.TraceEvents.isTraceEventConsoleTime(event)) {
        consoleTimings.push(event);
    }
    if (Types.TraceEvents.isTraceEventTimeStamp(event)) {
        timestampEvents.push(event);
    }
}
export async function finalize() {
    if (handlerState !== 2 /* HandlerState.INITIALIZED */) {
        throw new Error('UserTimings handler is not initialized');
    }
    const matchedEvents = new Map();
    for (const event of [...performanceMeasureEvents, ...consoleTimings]) {
        const id = Helpers.Trace.extractId(event);
        if (id === undefined) {
            continue;
        }
        // Create a synthetic id to prevent collisions across categories.
        // Console timings can be dispatched with the same id, so use the
        // event name as well to generate unique ids.
        const syntheticId = `${event.cat}:${id}:${event.name}`;
        const otherEventsWithID = Platform.MapUtilities.getWithDefault(matchedEvents, syntheticId, () => {
            return { begin: null, end: null };
        });
        const isStartEvent = event.ph === "b" /* Types.TraceEvents.Phase.ASYNC_NESTABLE_START */;
        const isEndEvent = event.ph === "e" /* Types.TraceEvents.Phase.ASYNC_NESTABLE_END */;
        if (isStartEvent) {
            otherEventsWithID.begin = event;
        }
        else if (isEndEvent) {
            otherEventsWithID.end = event;
        }
    }
    for (const [id, eventsPair] of matchedEvents.entries()) {
        if (!eventsPair.begin || !eventsPair.end) {
            // This should never happen, the backend only creates the events once it
            // has them both, so we should never get into this state.
            // If we do, something is very wrong, so let's just drop that problematic event.
            continue;
        }
        const event = {
            cat: eventsPair.end.cat,
            ph: eventsPair.end.ph,
            pid: eventsPair.end.pid,
            tid: eventsPair.end.tid,
            id,
            // Both events have the same name, so it doesn't matter which we pick to
            // use as the description
            name: eventsPair.begin.name,
            dur: Types.Timing.MicroSeconds(eventsPair.end.ts - eventsPair.begin.ts),
            ts: eventsPair.begin.ts,
            args: {
                data: {
                    beginEvent: eventsPair.begin,
                    endEvent: eventsPair.end,
                },
            },
        };
        syntheticEvents.push(event);
    }
    syntheticEvents.sort((event1, event2) => {
        if (event1.ts > event2.ts) {
            return 1;
        }
        if (event2.ts > event1.ts) {
            return -1;
        }
        return 0;
    });
    handlerState = 3 /* HandlerState.FINALIZED */;
}
export function data() {
    if (handlerState !== 3 /* HandlerState.FINALIZED */) {
        throw new Error('UserTimings handler is not finalized');
    }
    return {
        performanceMeasures: syntheticEvents.filter(Types.TraceEvents.isTraceEventPerformanceMeasure),
        consoleTimings: syntheticEvents.filter(Types.TraceEvents.isTraceEventConsoleTime),
        performanceMarks: [...performanceMarkEvents],
        timestampEvents: [...timestampEvents],
    };
}
//# sourceMappingURL=UserTimingsHandler.js.map