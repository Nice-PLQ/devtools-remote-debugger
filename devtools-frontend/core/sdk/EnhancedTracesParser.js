// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import { UserVisibleError } from '../platform/platform.js';
export class EnhancedTracesParser {
    #trace;
    #scriptRundownEvents = [];
    #scriptToV8Context = new Map();
    #scriptToFrame = new Map();
    #scriptToScriptSource = new Map();
    #largeScriptToScriptSource = new Map();
    #scriptToSourceLength = new Map();
    #targets = [];
    #executionContexts = [];
    #scripts = [];
    static enhancedTraceVersion = 1;
    constructor(trace) {
        this.#trace = trace;
        // Initialize with the trace provided.
        try {
            this.parseEnhancedTrace();
        }
        catch (e) {
            throw new UserVisibleError.UserVisibleError(e);
        }
    }
    parseEnhancedTrace() {
        for (const event of this.#trace.traceEvents) {
            if (this.isTargetRundownEvent(event)) {
                // Set up script to v8 context mapping
                const data = event.args?.data;
                this.#scriptToV8Context.set(this.getScriptIsolateId(data.isolate, data.scriptId), data.v8context);
                this.#scriptToFrame.set(this.getScriptIsolateId(data.isolate, data.scriptId), data.frame);
                // Add target
                if (!this.#targets.find(target => target.targetId === data.frame)) {
                    this.#targets.push({
                        targetId: data.frame,
                        type: data.frameType,
                        isolate: data.isolate,
                        pid: event.pid,
                        url: data.url,
                    });
                }
                // Add execution context, need to put back execution context id with info from other traces
                if (!this.#executionContexts.find(executionContext => executionContext.v8Context === data.v8context)) {
                    this.#executionContexts.push({
                        id: -1,
                        origin: data.origin,
                        v8Context: data.v8context,
                        auxData: {
                            frameId: data.frame,
                            isDefault: data.isDefault,
                            type: data.contextType,
                        },
                        isolate: data.isolate,
                    });
                }
            }
            else if (this.isScriptRundownEvent(event)) {
                this.#scriptRundownEvents.push(event);
                const data = event.args.data;
                // Add script
                if (!this.#scripts.find(script => script.scriptId === data.scriptId && script.isolate === data.isolate)) {
                    this.#scripts.push({
                        scriptId: data.scriptId,
                        isolate: data.isolate,
                        executionContextId: data.executionContextId,
                        startLine: data.startLine,
                        startColumn: data.startColumn,
                        endLine: data.endLine,
                        endColumn: data.endColumn,
                        hash: data.hash,
                        isModule: data.isModule,
                        url: data.url,
                        hasSourceURL: data.hasSourceUrl,
                        sourceURL: data.sourceUrl,
                        sourceMapURL: data.sourceMapUrl,
                    });
                }
            }
            else if (this.isScriptRundownSourceEvent(event)) {
                // Set up script to source text and length mapping
                const data = event.args.data;
                const scriptIsolateId = this.getScriptIsolateId(data.isolate, data.scriptId);
                if ('splitIndex' in data && 'splitCount' in data) {
                    if (!this.#largeScriptToScriptSource.has(scriptIsolateId)) {
                        this.#largeScriptToScriptSource.set(scriptIsolateId, new Array(data.splitCount).fill(''));
                    }
                    const splittedSource = this.#largeScriptToScriptSource.get(scriptIsolateId);
                    if (splittedSource && data.sourceText) {
                        splittedSource[data.splitIndex] = data.sourceText;
                    }
                }
                else {
                    if (data.sourceText) {
                        this.#scriptToScriptSource.set(scriptIsolateId, data.sourceText);
                    }
                    if (data.length) {
                        this.#scriptToSourceLength.set(scriptIsolateId, data.length);
                    }
                }
            }
        }
    }
    data() {
        // Put back execution context id
        const v8ContextToExecutionContextId = new Map();
        this.#scriptRundownEvents.forEach(scriptRundownEvent => {
            const data = scriptRundownEvent.args.data;
            const v8Context = this.#scriptToV8Context.get(this.getScriptIsolateId(data.isolate, data.scriptId));
            if (v8Context) {
                v8ContextToExecutionContextId.set(v8Context, data.executionContextId);
            }
        });
        this.#executionContexts.forEach(executionContext => {
            if (executionContext.v8Context) {
                const id = v8ContextToExecutionContextId.get(executionContext.v8Context);
                if (id) {
                    executionContext.id = id;
                }
            }
        });
        // Put back script source text and length
        this.#scripts.forEach(script => {
            const scriptIsolateId = this.getScriptIsolateId(script.isolate, script.scriptId);
            if (this.#scriptToScriptSource.has(scriptIsolateId)) {
                script.sourceText = this.#scriptToScriptSource.get(scriptIsolateId);
                script.length = this.#scriptToSourceLength.get(scriptIsolateId);
            }
            else if (this.#largeScriptToScriptSource.has(scriptIsolateId)) {
                const splittedSources = this.#largeScriptToScriptSource.get(scriptIsolateId);
                if (splittedSources) {
                    script.sourceText = splittedSources.join('');
                    script.length = script.sourceText.length;
                }
            }
            // put in the aux data
            script.auxData =
                this.#executionContexts
                    .find(context => context.id === script.executionContextId && context.isolate === script.isolate)
                    ?.auxData;
        });
        for (const script of this.#scripts) {
            // Resolve the source map from the provided metadata.
            // If no map is found for a given source map url, no source map is passed to the debugger model.
            // Encoded as a data url so that the debugger model makes no network request.
            // NOTE: consider passing directly as object and hacking `parsedScriptSource` in DebuggerModel.ts to handle
            // this fake event. Would avoid a lot of wasteful (de)serialization. Maybe add SDK.Script.hydratedSourceMap.
            script.sourceMapURL = this.getEncodedSourceMapUrl(script);
        }
        const data = new Map();
        for (const target of this.#targets) {
            data.set(target, this.groupContextsAndScriptsUnderTarget(target, this.#executionContexts, this.#scripts));
        }
        return data;
    }
    getEncodedSourceMapUrl(script) {
        if (script.sourceMapURL?.startsWith('data:')) {
            return script.sourceMapURL;
        }
        const sourceMap = this.getSourceMapFromMetadata(script);
        if (!sourceMap) {
            return;
        }
        return `data:text/plain;base64,${btoa(JSON.stringify(sourceMap))}`;
    }
    getSourceMapFromMetadata(script) {
        const { hasSourceURL, sourceURL, url, sourceMapURL, isolate, scriptId } = script;
        if (!sourceMapURL || !this.#trace.metadata.sourceMaps) {
            return;
        }
        const frame = this.#scriptToFrame.get(this.getScriptIsolateId(isolate, scriptId));
        if (!frame) {
            return;
        }
        const target = this.#targets.find(t => t.targetId === frame);
        if (!target) {
            return;
        }
        let resolvedSourceUrl = url;
        if (hasSourceURL && sourceURL) {
            const targetUrl = target.url;
            resolvedSourceUrl = Common.ParsedURL.ParsedURL.completeURL(targetUrl, sourceURL) ?? sourceURL;
        }
        // Resolve the source map url. The value given by v8 may be relative, so resolve it here.
        // This process should match the one in `SourceMapManager.attachSourceMap`.
        const resolvedSourceMapUrl = Common.ParsedURL.ParsedURL.completeURL(resolvedSourceUrl, sourceMapURL);
        if (!resolvedSourceMapUrl) {
            return;
        }
        const { sourceMap } = this.#trace.metadata.sourceMaps.find(m => m.sourceMapUrl === resolvedSourceMapUrl) ?? {};
        return sourceMap;
    }
    getScriptIsolateId(isolate, scriptId) {
        return scriptId + '@' + isolate;
    }
    isTraceEvent(event) {
        return 'cat' in event && 'pid' in event &&
            'args' in event && 'data' in event.args;
    }
    isTargetRundownEvent(event) {
        return this.isTraceEvent(event) && event.cat === 'disabled-by-default-devtools.target-rundown';
    }
    isScriptRundownEvent(event) {
        return this.isTraceEvent(event) && event.cat === 'disabled-by-default-devtools.v8-source-rundown';
    }
    isScriptRundownSourceEvent(event) {
        return this.isTraceEvent(event) && event.cat === 'disabled-by-default-devtools.v8-source-rundown-sources';
    }
    groupContextsAndScriptsUnderTarget(target, executionContexts, scripts) {
        const filteredExecutionContexts = [];
        const filteredScripts = [];
        for (const executionContext of executionContexts) {
            if (executionContext.auxData?.frameId === target.targetId) {
                filteredExecutionContexts.push(executionContext);
            }
        }
        for (const script of scripts) {
            if (script.auxData === null) {
                console.error(script + ' missing aux data');
            }
            if (script.auxData?.frameId === target.targetId) {
                filteredScripts.push(script);
            }
        }
        return [filteredExecutionContexts, filteredScripts];
    }
}
//# sourceMappingURL=EnhancedTracesParser.js.map