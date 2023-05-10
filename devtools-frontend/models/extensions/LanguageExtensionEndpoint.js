// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Bindings from '../bindings/bindings.js';
export class LanguageExtensionEndpoint extends Bindings.DebuggerLanguagePlugins.DebuggerLanguagePlugin {
    supportedScriptTypes;
    port;
    nextRequestId;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pendingRequests;
    constructor(name, supportedScriptTypes, port) {
        super(name);
        this.supportedScriptTypes = supportedScriptTypes;
        this.port = port;
        this.port.onmessage = this.onResponse.bind(this);
        this.nextRequestId = 0;
        this.pendingRequests = new Map();
    }
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendRequest(method, parameters) {
        return new Promise((resolve, reject) => {
            const requestId = this.nextRequestId++;
            this.pendingRequests.set(requestId, { resolve, reject });
            this.port.postMessage({ requestId, method, parameters });
        });
    }
    onResponse({ data }) {
        if ('event' in data) {
            const { event } = data;
            switch (event) {
                case "unregisteredLanguageExtensionPlugin" /* UnregisteredLanguageExtensionPlugin */: {
                    for (const { reject } of this.pendingRequests.values()) {
                        reject(new Error('Language extension endpoint disconnected'));
                    }
                    this.pendingRequests.clear();
                    this.port.close();
                    const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
                    if (pluginManager) {
                        pluginManager.removePlugin(this);
                    }
                    break;
                }
            }
            return;
        }
        const { requestId, result, error } = data;
        if (!this.pendingRequests.has(requestId)) {
            console.error(`No pending request ${requestId}`);
            return;
        }
        const { resolve, reject } = this.pendingRequests.get(requestId);
        this.pendingRequests.delete(requestId);
        if (error) {
            reject(new Error(error.message));
        }
        else {
            resolve(result);
        }
    }
    handleScript(script) {
        const language = script.scriptLanguage();
        return language !== null && script.debugSymbols !== null && language === this.supportedScriptTypes.language &&
            this.supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
    }
    /** Notify the plugin about a new script
       */
    addRawModule(rawModuleId, symbolsURL, rawModule) {
        return this.sendRequest("addRawModule" /* AddRawModule */, { rawModuleId, symbolsURL, rawModule });
    }
    /**
     * Notifies the plugin that a script is removed.
     */
    removeRawModule(rawModuleId) {
        return this.sendRequest("removeRawModule" /* RemoveRawModule */, { rawModuleId });
    }
    /** Find locations in raw modules from a location in a source file
       */
    sourceLocationToRawLocation(sourceLocation) {
        return this.sendRequest("sourceLocationToRawLocation" /* SourceLocationToRawLocation */, { sourceLocation });
    }
    /** Find locations in source files from a location in a raw module
       */
    rawLocationToSourceLocation(rawLocation) {
        return this.sendRequest("rawLocationToSourceLocation" /* RawLocationToSourceLocation */, { rawLocation });
    }
    getScopeInfo(type) {
        return this.sendRequest("getScopeInfo" /* GetScopeInfo */, { type });
    }
    /** List all variables in lexical scope at a given location in a raw module
       */
    listVariablesInScope(rawLocation) {
        return this.sendRequest("listVariablesInScope" /* ListVariablesInScope */, { rawLocation });
    }
    /** List all function names (including inlined frames) at location
       */
    getFunctionInfo(rawLocation) {
        return this.sendRequest("getFunctionInfo" /* GetFunctionInfo */, { rawLocation });
    }
    /** Find locations in raw modules corresponding to the inline function
       *  that rawLocation is in.
       */
    getInlinedFunctionRanges(rawLocation) {
        return this.sendRequest("getInlinedFunctionRanges" /* GetInlinedFunctionRanges */, { rawLocation });
    }
    /** Find locations in raw modules corresponding to inline functions
       *  called by the function or inline frame that rawLocation is in.
       */
    getInlinedCalleesRanges(rawLocation) {
        return this.sendRequest("getInlinedCalleesRanges" /* GetInlinedCalleesRanges */, { rawLocation });
    }
    getTypeInfo(expression, context) {
        return this.sendRequest("getTypeInfo" /* GetTypeInfo */, { expression, context });
    }
    getFormatter(expressionOrField, context) {
        return this.sendRequest("getFormatter" /* GetFormatter */, { expressionOrField, context });
    }
    getInspectableAddress(field) {
        return this.sendRequest("getInspectableAddress" /* GetInspectableAddress */, { field });
    }
    async getMappedLines(rawModuleId, sourceFileURL) {
        return this.sendRequest("getMappedLines" /* GetMappedLines */, { rawModuleId, sourceFileURL });
    }
    dispose() {
    }
}
//# sourceMappingURL=LanguageExtensionEndpoint.js.map