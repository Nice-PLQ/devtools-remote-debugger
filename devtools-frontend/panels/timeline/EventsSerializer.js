// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Trace from '../../models/trace/trace.js';
export class EventsSerializer {
    #modifiedProfileCallByKey = new Map();
    keyForEvent(event) {
        if (Trace.Types.Events.isProfileCall(event)) {
            return `${"p" /* Trace.Types.File.EventKeyType.PROFILE_CALL */}-${event.pid}-${event.tid}-${Trace.Types.Events.SampleIndex(event.sampleIndex)}-${event.nodeId}`;
        }
        if (Trace.Types.Events.isLegacyTimelineFrame(event)) {
            return `${"l" /* Trace.Types.File.EventKeyType.LEGACY_TIMELINE_FRAME */}-${event.index}`;
        }
        const rawEvents = Trace.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getRawTraceEvents();
        const key = Trace.Types.Events.isSyntheticBased(event) ?
            `${"s" /* Trace.Types.File.EventKeyType.SYNTHETIC_EVENT */}-${rawEvents.indexOf(event.rawSourceEvent)}` :
            `${"r" /* Trace.Types.File.EventKeyType.RAW_EVENT */}-${rawEvents.indexOf(event)}`;
        if (key.length < 3) {
            return null;
        }
        return key;
    }
    eventForKey(key, parsedTrace) {
        const eventValues = Trace.Types.File.traceEventKeyToValues(key);
        if (EventsSerializer.isProfileCallKey(eventValues)) {
            return this.#getModifiedProfileCallByKeyValues(eventValues, parsedTrace);
        }
        if (EventsSerializer.isLegacyTimelineFrameKey(eventValues)) {
            const event = parsedTrace.Frames.frames.at(eventValues.rawIndex);
            if (!event) {
                throw new Error(`Could not find frame with index ${eventValues.rawIndex}`);
            }
            return event;
        }
        if (EventsSerializer.isSyntheticEventKey(eventValues)) {
            const syntheticEvents = Trace.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getSyntheticTraces();
            const syntheticEvent = syntheticEvents.at(eventValues.rawIndex);
            if (!syntheticEvent) {
                throw new Error(`Attempted to get a synthetic event from an unknown raw event index: ${eventValues.rawIndex}`);
            }
            return syntheticEvent;
        }
        if (EventsSerializer.isRawEventKey(eventValues)) {
            const rawEvents = Trace.Helpers.SyntheticEvents.SyntheticEventsManager.getActiveManager().getRawTraceEvents();
            return rawEvents[eventValues.rawIndex];
        }
        throw new Error(`Unknown trace event serializable key values: ${eventValues.join('-')}`);
    }
    static isProfileCallKey(key) {
        return key.type === "p" /* Trace.Types.File.EventKeyType.PROFILE_CALL */;
    }
    static isLegacyTimelineFrameKey(key) {
        return key.type === "l" /* Trace.Types.File.EventKeyType.LEGACY_TIMELINE_FRAME */;
    }
    static isRawEventKey(key) {
        return key.type === "r" /* Trace.Types.File.EventKeyType.RAW_EVENT */;
    }
    static isSyntheticEventKey(key) {
        return key.type === "s" /* Trace.Types.File.EventKeyType.SYNTHETIC_EVENT */;
    }
    #getModifiedProfileCallByKeyValues(key, parsedTrace) {
        const cacheResult = this.#modifiedProfileCallByKey.get(key);
        if (cacheResult) {
            return cacheResult;
        }
        const profileCallsInThread = parsedTrace.Renderer.processes.get(key.processID)?.threads.get(key.threadID)?.profileCalls;
        if (!profileCallsInThread) {
            throw new Error(`Unknown profile call serializable key: ${(key)}`);
        }
        const match = profileCallsInThread?.find(e => {
            return e.sampleIndex === key.sampleIndex && e.nodeId === key.protocol;
        });
        if (!match) {
            throw new Error(`Unknown profile call serializable key: ${(JSON.stringify(key))}`);
        }
        // Cache to avoid looking up in subsequent calls.
        this.#modifiedProfileCallByKey.set(key, match);
        return match;
    }
}
//# sourceMappingURL=EventsSerializer.js.map