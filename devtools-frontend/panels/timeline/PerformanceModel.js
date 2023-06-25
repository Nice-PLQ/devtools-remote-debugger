// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as SourceMapScopes from '../../models/source_map_scopes/source_map_scopes.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import { TimelineUIUtils } from './TimelineUIUtils.js';
const resolveNamesTimeout = 500;
export class PerformanceModel extends Common.ObjectWrapper.ObjectWrapper {
    mainTargetInternal;
    tracingModelInternal;
    filtersInternal;
    timelineModelInternal;
    frameModelInternal;
    windowInternal;
    willResolveNames = false;
    recordStartTimeInternal;
    constructor() {
        super();
        this.mainTargetInternal = null;
        this.tracingModelInternal = null;
        this.filtersInternal = [];
        this.timelineModelInternal = new TimelineModel.TimelineModel.TimelineModelImpl();
        this.frameModelInternal = new TimelineModel.TimelineFrameModel.TimelineFrameModel(event => TimelineUIUtils.eventStyle(event).category.name);
        this.windowInternal = { left: 0, right: Infinity };
        this.recordStartTimeInternal = undefined;
    }
    setMainTarget(target) {
        this.mainTargetInternal = target;
    }
    mainTarget() {
        return this.mainTargetInternal;
    }
    setRecordStartTime(time) {
        this.recordStartTimeInternal = time;
    }
    recordStartTime() {
        return this.recordStartTimeInternal;
    }
    setFilters(filters) {
        this.filtersInternal = filters;
    }
    filters() {
        return this.filtersInternal;
    }
    isVisible(event) {
        return this.filtersInternal.every(f => f.accept(event));
    }
    async setTracingModel(model, isFreshRecording = false) {
        this.tracingModelInternal = model;
        this.timelineModelInternal.setEvents(model, isFreshRecording);
        await this.addSourceMapListeners();
        const mainTracks = this.timelineModelInternal.tracks().filter(track => track.type === TimelineModel.TimelineModel.TrackType.MainThread && track.forMainFrame &&
            track.events.length);
        const threadData = mainTracks.map(track => {
            const event = track.events[0];
            return { thread: event.thread, time: event.startTime };
        });
        this.frameModelInternal.addTraceEvents(this.mainTargetInternal, this.timelineModelInternal.inspectedTargetEvents(), threadData);
        this.autoWindowTimes();
    }
    #cpuProfileNodes() {
        return this.timelineModel().cpuProfiles().flatMap(p => p.nodes() || []);
    }
    async addSourceMapListeners() {
        const debuggerModelsToListen = new Set();
        for (const node of this.#cpuProfileNodes()) {
            if (!node) {
                continue;
            }
            const debuggerModelToListen = this.#maybeGetDebuggerModelForNode(node);
            if (!debuggerModelToListen) {
                continue;
            }
            debuggerModelsToListen.add(debuggerModelToListen);
        }
        for (const debuggerModel of debuggerModelsToListen) {
            debuggerModel.sourceMapManager().addEventListener(SDK.SourceMapManager.Events.SourceMapAttached, this.#onAttachedSourceMap, this);
        }
        await this.#resolveNamesFromCPUProfile();
    }
    // If a node corresponds to a script that has not been parsed or a script
    // that has a source map, we should listen to SourceMapAttached events to
    // attempt a function name resolving.
    #maybeGetDebuggerModelForNode(node) {
        const target = node.target();
        const debuggerModel = target?.model(SDK.DebuggerModel.DebuggerModel);
        if (!debuggerModel) {
            return null;
        }
        const script = debuggerModel.scriptForId(String(node.callFrame.scriptId));
        const shouldListenToSourceMap = !script || script.sourceMapURL;
        if (shouldListenToSourceMap) {
            return debuggerModel;
        }
        return null;
    }
    async #resolveNamesFromCPUProfile() {
        for (const node of this.#cpuProfileNodes()) {
            const resolvedFunctionName = await SourceMapScopes.NamesResolver.resolveProfileFrameFunctionName(node.callFrame, node.target());
            node.setFunctionName(resolvedFunctionName);
        }
    }
    async #onAttachedSourceMap() {
        if (!this.willResolveNames) {
            this.willResolveNames = true;
            // Resolving names triggers a repaint of the flame chart. Instead of attempting to resolve
            // names every time a source map is attached, wait for some time once the first source map is
            // attached. This way we allow for other source maps to be parsed before attempting a name
            // resolving using the available source maps. Otherwise the UI is blocked when the number
            // of source maps is particularly large.
            setTimeout(this.resolveNamesAndUpdate.bind(this), resolveNamesTimeout);
        }
    }
    async resolveNamesAndUpdate() {
        this.willResolveNames = false;
        await this.#resolveNamesFromCPUProfile();
        this.dispatchEventToListeners(Events.NamesResolved);
    }
    tracingModel() {
        if (!this.tracingModelInternal) {
            throw 'call setTracingModel before accessing PerformanceModel';
        }
        return this.tracingModelInternal;
    }
    timelineModel() {
        return this.timelineModelInternal;
    }
    frames() {
        return this.frameModelInternal.getFrames();
    }
    frameModel() {
        return this.frameModelInternal;
    }
    setWindow(window, animate) {
        this.windowInternal = window;
        this.dispatchEventToListeners(Events.WindowChanged, { window, animate });
    }
    window() {
        return this.windowInternal;
    }
    autoWindowTimes() {
        const timelineModel = this.timelineModelInternal;
        let tasks = [];
        for (const track of timelineModel.tracks()) {
            // Deliberately pick up last main frame's track.
            if (track.type === TimelineModel.TimelineModel.TrackType.MainThread && track.forMainFrame) {
                tasks = track.tasks;
            }
        }
        if (!tasks.length) {
            this.setWindow({ left: timelineModel.minimumRecordTime(), right: timelineModel.maximumRecordTime() });
            return;
        }
        function findLowUtilizationRegion(startIndex, stopIndex) {
            const threshold = 0.1;
            let cutIndex = startIndex;
            let cutTime = (tasks[cutIndex].startTime + tasks[cutIndex].endTime) / 2;
            let usedTime = 0;
            const step = Math.sign(stopIndex - startIndex);
            for (let i = startIndex; i !== stopIndex; i += step) {
                const task = tasks[i];
                const taskTime = (task.startTime + task.endTime) / 2;
                const interval = Math.abs(cutTime - taskTime);
                if (usedTime < threshold * interval) {
                    cutIndex = i;
                    cutTime = taskTime;
                    usedTime = 0;
                }
                usedTime += task.duration;
            }
            return cutIndex;
        }
        const rightIndex = findLowUtilizationRegion(tasks.length - 1, 0);
        const leftIndex = findLowUtilizationRegion(0, rightIndex);
        let leftTime = tasks[leftIndex].startTime;
        let rightTime = tasks[rightIndex].endTime;
        const span = rightTime - leftTime;
        const totalSpan = timelineModel.maximumRecordTime() - timelineModel.minimumRecordTime();
        if (span < totalSpan * 0.1) {
            leftTime = timelineModel.minimumRecordTime();
            rightTime = timelineModel.maximumRecordTime();
        }
        else {
            leftTime = Math.max(leftTime - 0.05 * span, timelineModel.minimumRecordTime());
            rightTime = Math.min(rightTime + 0.05 * span, timelineModel.maximumRecordTime());
        }
        this.setWindow({ left: leftTime, right: rightTime });
    }
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var Events;
(function (Events) {
    Events["WindowChanged"] = "WindowChanged";
    Events["NamesResolved"] = "NamesResolved";
})(Events || (Events = {}));
//# sourceMappingURL=PerformanceModel.js.map