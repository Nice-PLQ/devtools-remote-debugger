// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { data as metaHandlerData } from './MetaHandler.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';
// Each thread contains events. Events indicate the thread and process IDs, which are
// used to store the event in the correct process thread entry below.
const eventsInProcessThread = new Map();
let snapshots = [];
export function reset() {
    eventsInProcessThread.clear();
    snapshots.length = 0;
}
export function handleEvent(event) {
    if (event.ph !== "O" /* Types.TraceEvents.Phase.OBJECT_SNAPSHOT */ || event.name !== 'Screenshot') {
        return;
    }
    Helpers.Trace.addEventToProcessThread(event, eventsInProcessThread);
}
export async function finalize() {
    const { browserProcessId, browserThreadId } = metaHandlerData();
    const browserThreads = eventsInProcessThread.get(browserProcessId);
    if (browserThreads) {
        snapshots = browserThreads.get(browserThreadId) || [];
    }
}
export function data() {
    return [...snapshots];
}
export function deps() {
    return ['Meta'];
}
//# sourceMappingURL=ScreenshotsHandler.js.map