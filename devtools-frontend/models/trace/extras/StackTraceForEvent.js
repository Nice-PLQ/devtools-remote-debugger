// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Types from '../types/types.js';
export const stackTraceForEventInTrace = new Map();
export function clearCacheForTrace(parsedTrace) {
    stackTraceForEventInTrace.delete(parsedTrace);
}
/**
 * This util builds a stack trace that includes async calls for a given
 * event. It leverages data we collect from sampling to deduce sync
 * stacks and trace event instrumentation on the V8 debugger to stitch
 * them together.
 */
export function get(event, parsedTrace) {
    let cacheForTrace = stackTraceForEventInTrace.get(parsedTrace);
    if (!cacheForTrace) {
        cacheForTrace = new Map();
        stackTraceForEventInTrace.set(parsedTrace, cacheForTrace);
    }
    const resultFromCache = cacheForTrace.get(event);
    if (resultFromCache) {
        return resultFromCache;
    }
    let result = null;
    if (Types.Events.isProfileCall(event)) {
        result = getForProfileCall(event, parsedTrace);
    }
    else if (Types.Extensions.isSyntheticExtensionEntry(event)) {
        result = getForExtensionEntry(event, parsedTrace);
    }
    else if (Types.Events.isUserTiming(event)) {
        result = getForUserTiming(event, parsedTrace);
    }
    if (result) {
        cacheForTrace.set(event, result);
    }
    return result;
}
function getForProfileCall(event, parsedTrace) {
    // When working with a CPU profile the renderer handler won't have
    // entries in its tree.
    const entryToNode = parsedTrace.Renderer.entryToNode.size > 0 ? parsedTrace.Renderer.entryToNode : parsedTrace.Samples.entryToNode;
    const topStackTrace = { callFrames: [] };
    let stackTrace = topStackTrace;
    let currentEntry = event;
    let node = entryToNode.get(event);
    const traceCache = stackTraceForEventInTrace.get(parsedTrace) || new Map();
    stackTraceForEventInTrace.set(parsedTrace, traceCache);
    // Move up this node's ancestor tree appending frames to its
    // stack trace.
    while (node) {
        if (!Types.Events.isProfileCall(node.entry)) {
            node = node.parent;
            continue;
        }
        currentEntry = node.entry;
        // First check if this entry was processed before.
        const stackTraceFromCache = traceCache.get(node.entry);
        if (stackTraceFromCache) {
            stackTrace.callFrames.push(...stackTraceFromCache.callFrames.filter(callFrame => !isNativeJSFunction(callFrame)));
            stackTrace.parent = stackTraceFromCache.parent;
            // Only set the description to the cache value if we didn't
            // compute it in the previous iteration, since the async stack
            // trace descriptions / taskNames is only extracted when jumping
            // to the async parent, and that might not have happened when
            // the cached value was computed (e.g. the cached value
            // computation started at some point inside the parent stack
            // trace).
            stackTrace.description = stackTrace.description || stackTraceFromCache.description;
            break;
        }
        if (!isNativeJSFunction(currentEntry.callFrame)) {
            stackTrace.callFrames.push(currentEntry.callFrame);
        }
        const maybeAsyncParentEvent = parsedTrace.AsyncJSCalls.asyncCallToScheduler.get(currentEntry);
        const maybeAsyncParentNode = maybeAsyncParentEvent && entryToNode.get(maybeAsyncParentEvent.scheduler);
        if (maybeAsyncParentNode) {
            // The Protocol.Runtime.StackTrace type is recursive, so we
            // move one level deeper in it as we walk up the ancestor tree.
            stackTrace.parent = { callFrames: [] };
            stackTrace = stackTrace.parent;
            // Note: this description effectively corresponds to the name
            // of the task that scheduled the stack trace we are jumping
            // FROM, so it would make sense that it was set to that stack
            // trace instead of the one we are jumping TO. However, the
            // JS presentation utils we use to present async stack traces
            // assume the description is added to the stack trace that
            // scheduled the async task, so we build the data that way.
            stackTrace.description = maybeAsyncParentEvent.taskName;
            node = maybeAsyncParentNode;
            continue;
        }
        node = node.parent;
    }
    return topStackTrace;
}
/**
 * Finds the JS call in which an extension entry was injected (the
 * code location that called the extension API), and returns its stack
 * trace.
 */
function getForExtensionEntry(event, parsedTrace) {
    return getForUserTiming(event.rawSourceEvent, parsedTrace);
}
/**
 * Finds the JS call in which the user timing API was called and returns
 * its stack trace.
 */
function getForUserTiming(event, parsedTrace) {
    let rawEvent = event;
    if (Types.Events.isPerformanceMeasureBegin(event)) {
        if (event.args.traceId === undefined) {
            return null;
        }
        rawEvent = parsedTrace.UserTimings.measureTraceByTraceId.get(event.args.traceId);
    }
    if (!rawEvent) {
        return null;
    }
    // Look for the nearest profile call ancestor of the event tracing
    // the call to the API.
    let node = parsedTrace.Renderer.entryToNode.get(rawEvent);
    while (node && !Types.Events.isProfileCall(node.entry)) {
        node = node.parent;
    }
    if (node && Types.Events.isProfileCall(node.entry)) {
        return get(node.entry, parsedTrace);
    }
    return null;
}
/**
 * Determines if a function is a native JS API (like setTimeout,
 * requestAnimationFrame, consoleTask.run. etc.). This is useful to
 * discard stack frames corresponding to the JS scheduler function
 * itself, since it's already being used as title of async stack traces
 * taken from the async `taskName`. This is also consistent with the
 * behaviour of the stack trace in the sources
 * panel.
 */
function isNativeJSFunction({ columnNumber, lineNumber, url, scriptId }) {
    return lineNumber === -1 && columnNumber === -1 && url === '' && scriptId === '0';
}
//# sourceMappingURL=StackTraceForEvent.js.map