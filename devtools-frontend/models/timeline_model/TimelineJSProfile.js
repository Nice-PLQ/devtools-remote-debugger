// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TraceEngine from '../trace/trace.js';
import { RecordType, TimelineModelImpl } from './TimelineModel.js';
const UIStrings = {
    /**
     *@description Text for the name of a thread of the page
     *@example {1} PH1
     */
    threadS: 'Thread {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('models/timeline_model/TimelineJSProfile.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class TimelineJSProfileProcessor {
    /**
     * Creates a synthetic instant trace event for each sample in a
     * profile.
     * Each sample contains its stack trace under its args.data property.
     * The stack trace is extracted from a CPUProfileModel instance
     * which contains the call hierarchy.
     */
    static generateConstructedEventsFromCpuProfileDataModel(jsProfileModel, thread) {
        const samples = jsProfileModel.samples || [];
        const timestamps = jsProfileModel.timestamps;
        const jsEvents = [];
        const nodeToStackMap = new Map();
        let prevNode = jsProfileModel.root;
        let prevCallFrames = [];
        // Adds call stacks to fake trace events using the tree in CPUProfileDataModel
        for (let i = 0; i < samples.length; ++i) {
            const node = jsProfileModel.nodeByIndex(i);
            if (!node) {
                console.error(`Node with unknown id ${samples[i]} at index ${i}`);
                continue;
            }
            let callFrames;
            if (node === jsProfileModel.gcNode) {
                if (prevNode === jsProfileModel.gcNode) {
                    // If the last recorded sample is also GC sample, we just use the same call frames.
                    callFrames = prevCallFrames;
                }
                else {
                    // GC samples have no stack, so we just put GC node on top of the last recorded sample.
                    callFrames = [node, ...prevCallFrames];
                }
            }
            else {
                // For non Garbage Collection nodes, we just use its own call frames.
                callFrames = nodeToStackMap.get(node);
                if (!callFrames) {
                    callFrames = new Array(node.depth + 1);
                    nodeToStackMap.set(node, callFrames);
                    let currentNode = node;
                    for (let j = 0; currentNode.parent; currentNode = currentNode.parent) {
                        callFrames[j++] = currentNode;
                    }
                }
            }
            const name = node === jsProfileModel.idleNode ? RecordType.JSIdleSample :
                node === jsProfileModel.programNode || node === jsProfileModel.gcNode ? RecordType.JSSystemSample :
                    RecordType.JSSample;
            const jsSampleEvent = new SDK.TracingModel.ConstructedEvent(SDK.TracingModel.DevToolsTimelineEventCategory, name, "I" /* TraceEngine.Types.TraceEvents.Phase.INSTANT */, timestamps[i], thread);
            jsSampleEvent.args['data'] = { stackTrace: callFrames };
            jsEvents.push(jsSampleEvent);
            prevNode = node;
            prevCallFrames = callFrames;
        }
        return jsEvents;
    }
    static isJSSampleEvent(e) {
        return e.name === RecordType.JSSample || e.name === RecordType.JSSystemSample || e.name === RecordType.JSIdleSample;
    }
    /**
     * Creates the full call hierarchy, with durations, composed of trace
     * events and JavaScript function calls.
     *
     * Because JavaScript profiles come in the shape of samples with no
     * duration, JS function call durations are deduced using the timings
     * of subsequent equal samples and surrounding trace events.
     *
     * @param events merged ordered array of trace events and synthetic
     * "instant" events representing samples.
     * @param config flags to customize the shown events.
     * @returns the input event array with the new synthetic events
     * representing call frames.
     */
    static generateJSFrameEvents(events, config) {
        function equalFrames(frame1, frame2) {
            return frame1.scriptId === frame2.scriptId && frame1.functionName === frame2.functionName &&
                frame1.lineNumber === frame2.lineNumber;
        }
        function isJSInvocationEvent(e) {
            switch (e.name) {
                case RecordType.RunMicrotasks:
                case RecordType.FunctionCall:
                case RecordType.EvaluateScript:
                case RecordType.EvaluateModule:
                case RecordType.EventDispatch:
                case RecordType.V8Execute:
                    return true;
            }
            // Also consider any new v8 trace events. (eg 'V8.RunMicrotasks' and 'v8.run')
            if (e.name.startsWith('v8') || e.name.startsWith('V8')) {
                return true;
            }
            return false;
        }
        const jsFrameEvents = [];
        const jsFramesStack = [];
        const lockedJsStackDepth = [];
        let ordinal = 0;
        /**
         * `isJSInvocationEvent()` relies on an allowlist of invocation events that will parent JSFrames.
         * However in some situations (workers), we don't have those trace events.
         * "fake" JSInvocations are created when we have active JSSamples but seemingly no explicit invocation.
         */
        let fakeJSInvocation = false;
        const { showAllEvents, showRuntimeCallStats, showNativeFunctions } = config;
        /**
         * JSSamples are instant events, so any start events are not the samples.
         * We expect they'll either be trace events happening within JS (eg forced layout),
         * or, in the fakeJSInvocation case, the JS finished and we're seeing the subsequent event.
         */
        function onStartEvent(e) {
            if (SDK.TracingModel.eventIsFromNewEngine(e)) {
                // TODO(crbug.com/1431175) support CPU profiles in new engine.
                return;
            }
            if (fakeJSInvocation) {
                truncateJSStack(lockedJsStackDepth.pop(), e.startTime);
                fakeJSInvocation = false;
            }
            e.ordinal = ++ordinal;
            extractStackTrace(e);
            // For the duration of the event we cannot go beyond the stack associated with it.
            lockedJsStackDepth.push(jsFramesStack.length);
        }
        function onInstantEvent(e, parent) {
            if (SDK.TracingModel.eventIsFromNewEngine(e) || SDK.TracingModel.eventIsFromNewEngine(parent)) {
                // TODO(crbug.com/1431175) support CPU profiles in new engine.
                return;
            }
            e.ordinal = ++ordinal;
            if ((parent && isJSInvocationEvent(parent)) || fakeJSInvocation) {
                extractStackTrace(e);
            }
            else if (TimelineJSProfileProcessor.isJSSampleEvent(e) && e.args?.data?.stackTrace?.length &&
                jsFramesStack.length === 0) {
                // Force JS Samples to show up even if we are not inside a JS invocation event, because we
                // can be missing the start of JS invocation events if we start tracing half-way through.
                // Pretend we have a top-level JS invocation event.
                fakeJSInvocation = true;
                const stackDepthBefore = jsFramesStack.length;
                extractStackTrace(e);
                lockedJsStackDepth.push(stackDepthBefore);
            }
        }
        function onEndEvent(e) {
            if (SDK.TracingModel.eventIsFromNewEngine(e)) {
                // TODO(crbug.com/1431175) support CPU profiles in new engine.
                return;
            }
            truncateJSStack(lockedJsStackDepth.pop(), e.endTime);
        }
        /**
         * When a call stack that differs from the one we are tracking has
         * been detected in the samples, the latter is "truncated" by
         * setting the ending time of its call frames and removing the top
         * call frames that aren't shared with the new call stack. This way,
         * we can update the tracked stack with the new call frames on top.
         * @param depth the amount of call frames from bottom to top that
         * should be kept in the tracking stack trace. AKA amount of shared
         * call frames between two stacks.
         * @param time the new end of the call frames in the stack.
         */
        function truncateJSStack(depth, time) {
            if (lockedJsStackDepth.length) {
                const lockedDepth = lockedJsStackDepth.at(-1);
                if (lockedDepth && depth < lockedDepth) {
                    console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
                    depth = lockedDepth;
                }
            }
            if (jsFramesStack.length < depth) {
                console.error(`Trying to truncate higher than the current stack size at ${time}`);
                depth = jsFramesStack.length;
            }
            for (let k = 0; k < jsFramesStack.length; ++k) {
                jsFramesStack[k].setEndTime(time);
            }
            jsFramesStack.length = depth;
        }
        function showNativeName(name) {
            return showRuntimeCallStats && Boolean(TimelineJSProfileProcessor.nativeGroup(name));
        }
        function filterStackFrames(stack) {
            if (showAllEvents) {
                return;
            }
            let previousNativeFrameName = null;
            let j = 0;
            for (let i = 0; i < stack.length; ++i) {
                const frame = stack[i];
                const url = frame.url;
                const isNativeFrame = url && url.startsWith('native ');
                if (!showNativeFunctions && isNativeFrame) {
                    continue;
                }
                const isNativeRuntimeFrame = TimelineJSProfileProcessor.isNativeRuntimeFrame(frame);
                if (isNativeRuntimeFrame && !showNativeName(frame.functionName)) {
                    continue;
                }
                const nativeFrameName = isNativeRuntimeFrame ? TimelineJSProfileProcessor.nativeGroup(frame.functionName) : null;
                if (previousNativeFrameName && previousNativeFrameName === nativeFrameName) {
                    continue;
                }
                previousNativeFrameName = nativeFrameName;
                stack[j++] = frame;
            }
            stack.length = j;
        }
        /**
         * Update tracked stack using this event's call stack.
         */
        function extractStackTrace(e) {
            const callFrames = TimelineJSProfileProcessor.isJSSampleEvent(e) ?
                e.args['data']['stackTrace'].slice().reverse() :
                jsFramesStack.map(frameEvent => frameEvent.args['data']);
            filterStackFrames(callFrames);
            const endTime = e.endTime || e.startTime;
            const minFrames = Math.min(callFrames.length, jsFramesStack.length);
            let i;
            // Merge a sample's stack frames with the stack frames we have
            // so far if we detect they are equivalent.
            // Graphically
            // This:
            // Current stack trace       Sample
            // [-------A------]          [A]
            // [-------B------]          [B]
            // [-------C------]          [C]
            //                ^ t = x1    ^ t = x2
            // Becomes this:
            // New stack trace after merge
            // [--------A-------]
            // [--------B-------]
            // [--------C-------]
            //                  ^ t = x2
            for (i = lockedJsStackDepth.at(-1) || 0; i < minFrames; ++i) {
                const newFrame = callFrames[i];
                const oldFrame = jsFramesStack[i].args['data'];
                if (!equalFrames(newFrame, oldFrame)) {
                    break;
                }
                // Scoot the right edge of this callFrame to the right
                jsFramesStack[i].setEndTime(Math.max(jsFramesStack[i].endTime, endTime));
            }
            // If there are call frames in the sample that differ with the stack
            // we have, update the stack, but keeping the common frames in place
            // Graphically
            // This:
            // Current stack trace       Sample
            // [-------A------]          [A]
            // [-------B------]          [B]
            // [-------C------]          [C]
            // [-------D------]          [E]
            //                ^ t = x1    ^ t = x2
            // Becomes this:
            // New stack trace after merge
            // [--------A-------]
            // [--------B-------]
            // [--------C-------]
            //                [E]
            //                  ^ t = x2
            truncateJSStack(i, e.startTime);
            for (; i < callFrames.length; ++i) {
                const frame = callFrames[i];
                let jsFrameType = RecordType.JSFrame;
                switch (e.name) {
                    case RecordType.JSIdleSample:
                        jsFrameType = RecordType.JSIdleFrame;
                        break;
                    case RecordType.JSSystemSample:
                        jsFrameType = RecordType.JSSystemFrame;
                        break;
                }
                const jsFrameEvent = new SDK.TracingModel.ConstructedEvent(SDK.TracingModel.DevToolsTimelineEventCategory, jsFrameType, "X" /* TraceEngine.Types.TraceEvents.Phase.COMPLETE */, e.startTime, e.thread);
                jsFrameEvent.ordinal = e.ordinal;
                jsFrameEvent.addArgs({ data: frame });
                jsFrameEvent.setEndTime(endTime);
                jsFramesStack.push(jsFrameEvent);
                jsFrameEvents.push(jsFrameEvent);
            }
        }
        const firstTopLevelEvent = events.find(SDK.TracingModel.TracingModel.isTopLevelEvent);
        const startTime = firstTopLevelEvent ? firstTopLevelEvent.startTime : 0;
        TimelineModelImpl.forEachEvent(events, onStartEvent, onEndEvent, onInstantEvent, startTime);
        return jsFrameEvents;
    }
    static isNativeRuntimeFrame(frame) {
        return frame.url === 'native V8Runtime';
    }
    static nativeGroup(nativeName) {
        if (nativeName.startsWith('Parse')) {
            return TimelineJSProfileProcessor.NativeGroups.Parse;
        }
        if (nativeName.startsWith('Compile') || nativeName.startsWith('Recompile')) {
            return TimelineJSProfileProcessor.NativeGroups.Compile;
        }
        return null;
    }
    static createFakeTraceFromCpuProfile(profile, tid, injectPageEvent, name) {
        const events = [];
        if (injectPageEvent) {
            appendEvent('TracingStartedInPage', { data: { 'sessionId': '1' } }, 0, 0, 'M');
        }
        if (!name) {
            name = i18nString(UIStrings.threadS, { PH1: tid });
        }
        appendEvent(SDK.TracingModel.MetadataEvent.ThreadName, { name }, 0, 0, 'M', '__metadata');
        if (!profile) {
            return events;
        }
        // Append a root to show the start time of the profile (which is earlier than first sample), so the Performance
        // panel won't truncate this time period.
        appendEvent(RecordType.JSRoot, {}, profile.startTime, profile.endTime - profile.startTime, 'X', 'toplevel');
        // TODO: create a `Profile` event instead, as `cpuProfile` is legacy
        appendEvent('CpuProfile', { data: { 'cpuProfile': profile } }, profile.endTime, 0, 'I');
        return events;
        function appendEvent(name, args, ts, dur, ph, cat) {
            const event = { cat: cat || 'disabled-by-default-devtools.timeline', name, ph: ph || 'X', pid: 1, tid, ts, args };
            if (dur) {
                event.dur = dur;
            }
            events.push(event);
            return event;
        }
    }
}
(function (TimelineJSProfileProcessor) {
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line rulesdir/const_enum
    let NativeGroups;
    (function (NativeGroups) {
        NativeGroups["Compile"] = "Compile";
        NativeGroups["Parse"] = "Parse";
    })(NativeGroups = TimelineJSProfileProcessor.NativeGroups || (TimelineJSProfileProcessor.NativeGroups = {}));
})(TimelineJSProfileProcessor || (TimelineJSProfileProcessor = {}));
//# sourceMappingURL=TimelineJSProfile.js.map