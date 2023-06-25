// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Types from '../types/types.js';
// This handler serves two purposes. It generates a list of events that are
// used to show user clicks in the timeline. It is also used to gather
// EventTimings into Interactions, which we use to show interactions and
// highlight long interactions to the user, along with INP.
// We don't need to know which process / thread these events occurred in,
// because they are effectively global, so we just track all that we find.
const allEvents = [];
let longestInteractionEvent = null;
const interactionEvents = [];
const interactionEventsWithNoNesting = [];
const eventTimingEndEventsById = new Map();
const eventTimingStartEventsForInteractions = [];
let handlerState = 1 /* HandlerState.UNINITIALIZED */;
export function reset() {
    allEvents.length = 0;
    interactionEvents.length = 0;
    eventTimingStartEventsForInteractions.length = 0;
    eventTimingEndEventsById.clear();
    interactionEventsWithNoNesting.length = 0;
    handlerState = 2 /* HandlerState.INITIALIZED */;
}
export function handleEvent(event) {
    if (handlerState !== 2 /* HandlerState.INITIALIZED */) {
        throw new Error('Handler is not initialized');
    }
    if (!Types.TraceEvents.isTraceEventEventTiming(event)) {
        return;
    }
    if (Types.TraceEvents.isTraceEventEventTimingEnd(event)) {
        // Store the end event; for each start event that is an interaction, we need the matching end event to calculate the duration correctly.
        eventTimingEndEventsById.set(event.id, event);
    }
    allEvents.push(event);
    // From this point on we want to find events that represent interactions.
    // These events are always start events - those are the ones that contain all
    // the metadata about the interaction.
    if (!event.args.data || !Types.TraceEvents.isTraceEventEventTimingStart(event)) {
        return;
    }
    const { duration, interactionId } = event.args.data;
    // We exclude events for the sake of interactions if:
    // 1. They have no duration.
    // 2. They have no interactionId
    // 3. They have an interactionId of 0: this indicates that it's not an
    //    interaction that we care about because it hasn't had its own interactionId
    //    set (0 is the default on the backend).
    // See: https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/timing/responsiveness_metrics.cc;l=133;drc=40c209a9c365ebb9f16fb99dfe78c7fe768b9594
    if (duration < 1 || interactionId === undefined || interactionId === 0) {
        return;
    }
    // Store the start event. In the finalize() function we will pair this with
    // its end event and create the synthetic interaction event.
    eventTimingStartEventsForInteractions.push(event);
}
/**
 * See https://web.dev/better-responsiveness-metric/#interaction-types for the
 * table that defines these sets.
 **/
const pointerEventTypes = new Set([
    'pointerdown',
    'touchstart',
    'pointerup',
    'touchend',
    'mousedown',
    'mouseup',
    'click',
]);
const keyboardEventTypes = new Set([
    'keydown',
    'keypress',
    'keyup',
]);
export function categoryOfInteraction(interaction) {
    if (pointerEventTypes.has(interaction.type)) {
        return 'POINTER';
    }
    if (keyboardEventTypes.has(interaction.type)) {
        return 'KEYBOARD';
    }
    return 'OTHER';
}
/**
 * We define a set of interactions as nested where:
 * 1. Their end times align.
 * 2. The longest interaction's start time is earlier than all other
 * interactions with the same end time.
 * 3. The interactions are of the same category [each interaction is either
 * categorised as keyboard, or pointer.]
 *
 * =============A=[pointerup]=
 *        ====B=[pointerdown]=
 *        ===C=[pointerdown]==
 *         ===D=[pointerup]===
 *
 * In this example, B, C and D are all nested and therefore should not be
 * returned from this function.
 *
 * However, in this example we would only consider B nested (under A) and D
 * nested (under C). A and C both stay because they are of different types.
 * ========A=[keydown]====
 *   =======B=[keyup]=====
 *    ====C=[pointerdown]=
 *         =D=[pointerup]=
 **/
export function removeNestedInteractions(interactions) {
    /**
     * Because we nest events only that are in the same category, we store the
     * longest event for a given end time by category.
     **/
    const earliestEventForEndTimePerCategory = {
        POINTER: new Map(),
        KEYBOARD: new Map(),
        OTHER: new Map(),
    };
    function storeEventIfEarliestForCategoryAndEndTime(interaction) {
        const category = categoryOfInteraction(interaction);
        const mapToUse = earliestEventForEndTimePerCategory[category];
        const endTime = Types.Timing.MicroSeconds(interaction.ts + interaction.dur);
        const earliestCurrentEvent = mapToUse.get(endTime);
        if (!earliestCurrentEvent) {
            mapToUse.set(endTime, interaction);
            return;
        }
        if (interaction.ts < earliestCurrentEvent.ts) {
            mapToUse.set(endTime, interaction);
        }
    }
    for (const interaction of interactions) {
        storeEventIfEarliestForCategoryAndEndTime(interaction);
    }
    // Combine all the events that we have kept from all the per-category event
    // maps back into an array and sort them by timestamp.
    const keptEvents = Object.values(earliestEventForEndTimePerCategory)
        .flatMap(eventsByEndTime => Array.from(eventsByEndTime.values()));
    keptEvents.sort((eventA, eventB) => {
        return eventA.ts - eventB.ts;
    });
    return keptEvents;
}
export async function finalize() {
    // For each interaction start event, find the async end event by the ID, and then create the Synthetic Interaction event.
    for (const interactionStartEvent of eventTimingStartEventsForInteractions) {
        const endEvent = eventTimingEndEventsById.get(interactionStartEvent.id);
        if (!endEvent) {
            // If we cannot find an end event, bail and drop this event.
            continue;
        }
        if (!interactionStartEvent.args.data?.type || !interactionStartEvent.args.data?.interactionId) {
            // A valid interaction event that we care about has to have a type (e.g.
            // pointerdown, keyup).
            //
            // We also need to ensure it has an interactionId. We already checked
            // this in the handleEvent() function, but we do it here also to satisfy
            // TypeScript.
            continue;
        }
        const interactionEvent = {
            // Use the start event to define the common fields.
            cat: interactionStartEvent.cat,
            name: interactionStartEvent.name,
            pid: interactionStartEvent.pid,
            tid: interactionStartEvent.tid,
            ph: interactionStartEvent.ph,
            args: {
                data: {
                    beginEvent: interactionStartEvent,
                    endEvent: endEvent,
                },
            },
            ts: interactionStartEvent.ts,
            dur: Types.Timing.MicroSeconds(endEvent.ts - interactionStartEvent.ts),
            type: interactionStartEvent.args.data.type,
            interactionId: interactionStartEvent.args.data.interactionId,
        };
        if (!longestInteractionEvent || longestInteractionEvent.dur < interactionEvent.dur) {
            longestInteractionEvent = interactionEvent;
        }
        interactionEvents.push(interactionEvent);
    }
    handlerState = 3 /* HandlerState.FINALIZED */;
    interactionEventsWithNoNesting.push(...removeNestedInteractions(interactionEvents));
}
export function data() {
    return {
        allEvents: [...allEvents],
        interactionEvents: [...interactionEvents],
        interactionEventsWithNoNesting: [...interactionEventsWithNoNesting],
        longestInteractionEvent,
    };
}
//# sourceMappingURL=UserInteractionsHandler.js.map