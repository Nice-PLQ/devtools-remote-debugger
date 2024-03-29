// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export class RenderCoordinatorQueueEmptyEvent extends Event {
    static eventName = 'renderqueueempty';
    constructor() {
        super(RenderCoordinatorQueueEmptyEvent.eventName);
    }
}
export class RenderCoordinatorNewFrameEvent extends Event {
    static eventName = 'newframe';
    constructor() {
        super(RenderCoordinatorNewFrameEvent.eventName);
    }
}
let renderCoordinatorInstance;
const UNNAMED_READ = 'Unnamed read';
const UNNAMED_WRITE = 'Unnamed write';
const UNNAMED_SCROLL = 'Unnamed scroll';
const DEADLOCK_TIMEOUT = 1500;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalThis.__getRenderCoordinatorPendingFrames = function () {
    return RenderCoordinator.pendingFramesCount();
};
export class RenderCoordinator extends EventTarget {
    static instance({ forceNew = false } = {}) {
        if (!renderCoordinatorInstance || forceNew) {
            renderCoordinatorInstance = new RenderCoordinator();
        }
        return renderCoordinatorInstance;
    }
    static pendingFramesCount() {
        if (!renderCoordinatorInstance) {
            throw new Error('No render coordinator instance found.');
        }
        return renderCoordinatorInstance.pendingFramesCount();
    }
    // Toggle on to start tracking. You must call takeRecords() to
    // obtain the records. Please note: records are limited by maxRecordSize below.
    observe = false;
    recordStorageLimit = 100;
    // If true, only log activity with an explicit label.
    // This does not affect logging frames or queue empty events.
    observeOnlyNamed = true;
    #logInternal = [];
    #pendingWorkFrames = [];
    #scheduledWorkId = 0;
    pendingFramesCount() {
        return this.#pendingWorkFrames.length;
    }
    done(options) {
        if (this.#pendingWorkFrames.length === 0 && !options?.waitForWork) {
            this.#logIfEnabled('[Queue empty]');
            return Promise.resolve();
        }
        return new Promise(resolve => this.addEventListener('renderqueueempty', () => resolve(), { once: true }));
    }
    async read(labelOrCallback, callback) {
        if (typeof labelOrCallback === 'string') {
            if (!callback) {
                throw new Error('Read called with label but no callback');
            }
            return this.#enqueueHandler(callback, "read" /* ACTION.READ */, labelOrCallback);
        }
        return this.#enqueueHandler(labelOrCallback, "read" /* ACTION.READ */, UNNAMED_READ);
    }
    async write(labelOrCallback, callback) {
        if (typeof labelOrCallback === 'string') {
            if (!callback) {
                throw new Error('Write called with label but no callback');
            }
            return this.#enqueueHandler(callback, "write" /* ACTION.WRITE */, labelOrCallback);
        }
        return this.#enqueueHandler(labelOrCallback, "write" /* ACTION.WRITE */, UNNAMED_WRITE);
    }
    takeRecords() {
        const logs = [...this.#logInternal];
        this.#logInternal.length = 0;
        return logs;
    }
    async scroll(labelOrCallback, callback) {
        if (typeof labelOrCallback === 'string') {
            if (!callback) {
                throw new Error('Scroll called with label but no callback');
            }
            return this.#enqueueHandler(callback, "read" /* ACTION.READ */, labelOrCallback);
        }
        return this.#enqueueHandler(labelOrCallback, "read" /* ACTION.READ */, UNNAMED_SCROLL);
    }
    #enqueueHandler(callback, action, label) {
        const hasName = ![UNNAMED_READ, UNNAMED_WRITE, UNNAMED_SCROLL].includes(label);
        label = `${action === "read" /* ACTION.READ */ ? '[Read]' : '[Write]'}: ${label}`;
        if (this.#pendingWorkFrames.length === 0) {
            this.#pendingWorkFrames.push({
                readers: [],
                writers: [],
            });
        }
        const frame = this.#pendingWorkFrames[0];
        if (!frame) {
            throw new Error('No frame available');
        }
        let workItems = null;
        switch (action) {
            case "read" /* ACTION.READ */:
                workItems = frame.readers;
                break;
            case "write" /* ACTION.WRITE */:
                workItems = frame.writers;
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        let workItem = hasName ? workItems.find(w => w.label === label) : null;
        if (!workItem) {
            const newWorkItem = { label };
            newWorkItem.promise = (new Promise((resolve, reject) => {
                newWorkItem.trigger = resolve;
                newWorkItem.cancel = reject;
            })).then(() => newWorkItem.handler());
            workItem = newWorkItem;
            workItems.push(workItem);
        }
        // We are always using the latest handler, so that we don't end up with a
        // stale results. We are reusing the promise to avoid blocking the first invocation, when
        // it is being "overridden" by another one.
        workItem.handler = callback;
        this.#scheduleWork();
        return workItem.promise;
    }
    #scheduleWork() {
        const hasScheduledWork = this.#scheduledWorkId !== 0;
        if (hasScheduledWork) {
            return;
        }
        this.#scheduledWorkId = requestAnimationFrame(async () => {
            const hasPendingFrames = this.#pendingWorkFrames.length > 0;
            if (!hasPendingFrames) {
                // No pending frames means all pending work has completed.
                // The events dispatched below are mostly for testing contexts.
                // The first is for cases where we have a direct reference to
                // the render coordinator. The second is for other test contexts
                // where we don't, and instead we listen for an event on the window.
                this.dispatchEvent(new RenderCoordinatorQueueEmptyEvent());
                window.dispatchEvent(new RenderCoordinatorQueueEmptyEvent());
                this.#logIfEnabled('[Queue empty]');
                this.#scheduledWorkId = 0;
                return;
            }
            this.dispatchEvent(new RenderCoordinatorNewFrameEvent());
            this.#logIfEnabled('[New frame]');
            const frame = this.#pendingWorkFrames.shift();
            if (!frame) {
                return;
            }
            // Start with all the readers and allow them
            // to proceed together.
            for (const reader of frame.readers) {
                this.#logIfEnabled(reader.label);
                reader.trigger();
            }
            // Wait for them all to be done.
            try {
                await Promise.race([
                    Promise.all(frame.readers.map(r => r.promise)),
                    new Promise((_, reject) => {
                        window.setTimeout(() => reject(new Error(`Readers took over ${DEADLOCK_TIMEOUT}ms. Possible deadlock?`)), DEADLOCK_TIMEOUT);
                    }),
                ]);
            }
            catch (err) {
                this.#rejectAll(frame.readers, err);
            }
            // Next do all the writers as a block.
            for (const writer of frame.writers) {
                this.#logIfEnabled(writer.label);
                writer.trigger();
            }
            // And wait for them to be done, too.
            try {
                await Promise.race([
                    Promise.all(frame.writers.map(w => w.promise)),
                    new Promise((_, reject) => {
                        window.setTimeout(() => reject(new Error(`Writers took over ${DEADLOCK_TIMEOUT}ms. Possible deadlock?`)), DEADLOCK_TIMEOUT);
                    }),
                ]);
            }
            catch (err) {
                this.#rejectAll(frame.writers, err);
            }
            // Since there may have been more work requested in
            // the callback of a reader / writer, we attempt to schedule
            // it at this point.
            this.#scheduledWorkId = 0;
            this.#scheduleWork();
        });
    }
    #rejectAll(handlers, error) {
        for (const handler of handlers) {
            handler.cancel(error);
        }
    }
    cancelPending() {
        const error = new Error();
        for (const frame of this.#pendingWorkFrames) {
            this.#rejectAll(frame.readers, error);
            this.#rejectAll(frame.writers, error);
        }
    }
    #logIfEnabled(value) {
        if (!this.observe || !value) {
            return;
        }
        const hasNoName = value.endsWith(UNNAMED_READ) || value.endsWith(UNNAMED_WRITE) || value.endsWith(UNNAMED_SCROLL);
        if (hasNoName && this.observeOnlyNamed) {
            return;
        }
        this.#logInternal.push({ time: performance.now(), value });
        // Keep the log at the log size.
        while (this.#logInternal.length > this.recordStorageLimit) {
            this.#logInternal.shift();
        }
    }
}
//# sourceMappingURL=RenderCoordinator.js.map