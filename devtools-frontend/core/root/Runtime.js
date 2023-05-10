// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
const originalConsole = console;
const originalAssert = console.assert;
const queryParamsObject = new URLSearchParams(location.search);
// The following variable are initialized all the way at the bottom of this file
let importScriptPathPrefix;
let runtimePlatform = '';
let runtimeInstance;
export function getRemoteBase(location = self.location.toString()) {
    const url = new URL(location);
    const remoteBase = url.searchParams.get('remoteBase');
    if (!remoteBase) {
        return null;
    }
    const version = /\/serve_file\/(@[0-9a-zA-Z]+)\/?$/.exec(remoteBase);
    if (!version) {
        return null;
    }
    return { base: `${url.origin}/remote/serve_file/${version[1]}/`, version: version[1] };
}
export const mappingForLayoutTests = new Map([
    ['panels/animation', 'animation'],
    ['panels/browser_debugger', 'browser_debugger'],
    ['panels/changes', 'changes'],
    ['panels/console', 'console'],
    ['panels/elements', 'elements'],
    ['panels/emulation', 'emulation'],
    ['panels/mobile_throttling', 'mobile_throttling'],
    ['panels/network', 'network'],
    ['panels/profiler', 'profiler'],
    ['panels/application', 'resources'],
    ['panels/search', 'search'],
    ['panels/sources', 'sources'],
    ['panels/snippets', 'snippets'],
    ['panels/settings', 'settings'],
    ['panels/timeline', 'timeline'],
    ['panels/web_audio', 'web_audio'],
    ['models/persistence', 'persistence'],
    ['models/workspace_diff', 'workspace_diff'],
    ['entrypoints/main', 'main'],
    ['third_party/diff', 'diff'],
    ['ui/legacy/components/inline_editor', 'inline_editor'],
    ['ui/legacy/components/data_grid', 'data_grid'],
    ['ui/legacy/components/perf_ui', 'perf_ui'],
    ['ui/legacy/components/source_frame', 'source_frame'],
    ['ui/legacy/components/color_picker', 'color_picker'],
    ['ui/legacy/components/cookie_table', 'cookie_table'],
    ['ui/legacy/components/text_editor', 'text_editor'],
    ['ui/legacy/components/quick_open', 'quick_open'],
    ['ui/legacy/components/utils', 'components'],
]);
export class Runtime {
    #modules;
    modulesMap;
    #descriptorsMap;
    constructor(descriptors) {
        this.#modules = [];
        this.modulesMap = {};
        this.#descriptorsMap = {};
        for (const descriptor of descriptors) {
            this.registerModule(descriptor);
        }
    }
    static instance(opts = { forceNew: null, moduleDescriptors: null }) {
        const { forceNew, moduleDescriptors } = opts;
        if (!runtimeInstance || forceNew) {
            if (!moduleDescriptors) {
                throw new Error(`Unable to create runtime: moduleDescriptors must be provided: ${new Error().stack}`);
            }
            runtimeInstance = new Runtime(moduleDescriptors);
        }
        return runtimeInstance;
    }
    static removeInstance() {
        runtimeInstance = undefined;
    }
    /**
     * http://tools.ietf.org/html/rfc3986#section-5.2.4
     */
    static normalizePath(path) {
        if (path.indexOf('..') === -1 && path.indexOf('.') === -1) {
            return path;
        }
        const normalizedSegments = [];
        const segments = path.split('/');
        for (const segment of segments) {
            if (segment === '.') {
                continue;
            }
            else if (segment === '..') {
                normalizedSegments.pop();
            }
            else if (segment) {
                normalizedSegments.push(segment);
            }
        }
        let normalizedPath = normalizedSegments.join('/');
        if (normalizedPath[normalizedPath.length - 1] === '/') {
            return normalizedPath;
        }
        if (path[0] === '/' && normalizedPath) {
            normalizedPath = '/' + normalizedPath;
        }
        if ((path[path.length - 1] === '/') || (segments[segments.length - 1] === '.') ||
            (segments[segments.length - 1] === '..')) {
            normalizedPath = normalizedPath + '/';
        }
        return normalizedPath;
    }
    static queryParam(name) {
        return queryParamsObject.get(name);
    }
    static experimentsSetting() {
        try {
            return JSON.parse(self.localStorage && self.localStorage['experiments'] ? self.localStorage['experiments'] : '{}');
        }
        catch (e) {
            console.error('Failed to parse localStorage[\'experiments\']');
            return {};
        }
    }
    static assert(value, message) {
        if (value) {
            return;
        }
        originalAssert.call(originalConsole, value, message + ' ' + new Error().stack);
    }
    static setPlatform(platform) {
        runtimePlatform = platform;
    }
    static platform() {
        return runtimePlatform;
    }
    static isDescriptorEnabled(descriptor) {
        const activatorExperiment = descriptor['experiment'];
        if (activatorExperiment === '*') {
            return true;
        }
        if (activatorExperiment && activatorExperiment.startsWith('!') &&
            experiments.isEnabled(activatorExperiment.substring(1))) {
            return false;
        }
        if (activatorExperiment && !activatorExperiment.startsWith('!') && !experiments.isEnabled(activatorExperiment)) {
            return false;
        }
        const condition = descriptor['condition'];
        if (condition && !condition.startsWith('!') && !Runtime.queryParam(condition)) {
            return false;
        }
        if (condition && condition.startsWith('!') && Runtime.queryParam(condition.substring(1))) {
            return false;
        }
        return true;
    }
    static resolveSourceURL(path) {
        let sourceURL = self.location.href;
        if (self.location.search) {
            sourceURL = sourceURL.replace(self.location.search, '');
        }
        sourceURL = sourceURL.substring(0, sourceURL.lastIndexOf('/') + 1) + path;
        return '\n/*# sourceURL=' + sourceURL + ' */';
    }
    module(moduleName) {
        return this.modulesMap[moduleName];
    }
    registerModule(descriptor) {
        const module = new Module(this, descriptor);
        this.#modules.push(module);
        this.modulesMap[descriptor['name']] = module;
        const mappedName = mappingForLayoutTests.get(descriptor['name']);
        if (mappedName !== undefined) {
            this.modulesMap[mappedName] = module;
        }
    }
    loadModulePromise(moduleName) {
        return this.modulesMap[moduleName].loadPromise();
    }
    loadAutoStartModules(moduleNames) {
        const promises = [];
        for (const moduleName of moduleNames) {
            promises.push(this.loadModulePromise(moduleName));
        }
        return Promise.all(promises);
    }
    getModulesMap() {
        return this.modulesMap;
    }
}
export class ModuleDescriptor {
    name;
    dependencies;
    modules;
    resources;
    condition;
    experiment;
    constructor() {
    }
}
function computeContainingFolderName(name) {
    if (name.includes('/')) {
        return name.substring(name.lastIndexOf('/') + 1, name.length);
    }
    return name;
}
export class Module {
    #manager;
    descriptor;
    #nameInternal;
    #loadedForTest;
    #pendingLoadPromise;
    constructor(manager, descriptor) {
        this.#manager = manager;
        this.descriptor = descriptor;
        this.#nameInternal = descriptor.name;
        this.#loadedForTest = false;
    }
    name() {
        return this.#nameInternal;
    }
    enabled() {
        return Runtime.isDescriptorEnabled(this.descriptor);
    }
    resource(name) {
        const fullName = this.#nameInternal + '/' + name;
        const content = cachedResources.get(fullName);
        if (!content) {
            throw new Error(fullName + ' not preloaded. Check module.json');
        }
        return content;
    }
    loadPromise() {
        if (!this.enabled()) {
            return Promise.reject(new Error('Module ' + this.#nameInternal + ' is not enabled'));
        }
        if (this.#pendingLoadPromise) {
            return this.#pendingLoadPromise;
        }
        const dependencies = this.descriptor.dependencies;
        const dependencyPromises = [];
        for (let i = 0; dependencies && i < dependencies.length; ++i) {
            dependencyPromises.push(this.#manager.getModulesMap()[dependencies[i]].loadPromise());
        }
        this.#pendingLoadPromise = Promise.all(dependencyPromises).then(this.loadModules.bind(this)).then(() => {
            this.#loadedForTest = true;
            return this.#loadedForTest;
        });
        return this.#pendingLoadPromise;
    }
    async loadModules() {
        const containingFolderName = computeContainingFolderName(this.#nameInternal);
        const moduleFileName = `${containingFolderName}_module.js`;
        const entrypointFileName = `${containingFolderName}.js`;
        // If a module has resources, they are part of the `_module.js` files that are generated
        // by `build_release_applications`. These need to be loaded before any other code is
        // loaded, to make sure that the resource content is properly cached in `cachedResources`.
        if (this.descriptor.modules && this.descriptor.modules.includes(moduleFileName)) {
            await import(`../../${this.#nameInternal}/${moduleFileName}`);
        }
        await import(`../../${this.#nameInternal}/${entrypointFileName}`);
    }
    modularizeURL(resourceName) {
        return Runtime.normalizePath(this.#nameInternal + '/' + resourceName);
    }
    fetchResource(resourceName) {
        const sourceURL = getResourceURL(this.modularizeURL(resourceName));
        return loadResourcePromise(sourceURL);
    }
}
export class ExperimentsSupport {
    #experiments;
    #experimentNames;
    #enabledTransiently;
    #enabledByDefault;
    #serverEnabled;
    constructor() {
        this.#experiments = [];
        this.#experimentNames = new Set();
        this.#enabledTransiently = new Set();
        this.#enabledByDefault = new Set();
        this.#serverEnabled = new Set();
    }
    allConfigurableExperiments() {
        const result = [];
        for (const experiment of this.#experiments) {
            if (!this.#enabledTransiently.has(experiment.name)) {
                result.push(experiment);
            }
        }
        return result;
    }
    enabledExperiments() {
        return this.#experiments.filter(experiment => experiment.isEnabled());
    }
    setExperimentsSetting(value) {
        if (!self.localStorage) {
            return;
        }
        self.localStorage['experiments'] = JSON.stringify(value);
    }
    register(experimentName, experimentTitle, unstable, docLink) {
        Runtime.assert(!this.#experimentNames.has(experimentName), 'Duplicate registration of experiment ' + experimentName);
        this.#experimentNames.add(experimentName);
        this.#experiments.push(new Experiment(this, experimentName, experimentTitle, Boolean(unstable), docLink ?? ''));
    }
    isEnabled(experimentName) {
        this.checkExperiment(experimentName);
        // Check for explicitly disabled #experiments first - the code could call setEnable(false) on the experiment enabled
        // by default and we should respect that.
        if (Runtime.experimentsSetting()[experimentName] === false) {
            return false;
        }
        if (this.#enabledTransiently.has(experimentName) || this.#enabledByDefault.has(experimentName)) {
            return true;
        }
        if (this.#serverEnabled.has(experimentName)) {
            return true;
        }
        return Boolean(Runtime.experimentsSetting()[experimentName]);
    }
    setEnabled(experimentName, enabled) {
        this.checkExperiment(experimentName);
        const experimentsSetting = Runtime.experimentsSetting();
        experimentsSetting[experimentName] = enabled;
        this.setExperimentsSetting(experimentsSetting);
    }
    enableExperimentsTransiently(experimentNames) {
        for (const experimentName of experimentNames) {
            this.checkExperiment(experimentName);
            this.#enabledTransiently.add(experimentName);
        }
    }
    enableExperimentsByDefault(experimentNames) {
        for (const experimentName of experimentNames) {
            this.checkExperiment(experimentName);
            this.#enabledByDefault.add(experimentName);
        }
    }
    setServerEnabledExperiments(experimentNames) {
        for (const experiment of experimentNames) {
            this.checkExperiment(experiment);
            this.#serverEnabled.add(experiment);
        }
    }
    enableForTest(experimentName) {
        this.checkExperiment(experimentName);
        this.#enabledTransiently.add(experimentName);
    }
    clearForTest() {
        this.#experiments = [];
        this.#experimentNames.clear();
        this.#enabledTransiently.clear();
        this.#enabledByDefault.clear();
        this.#serverEnabled.clear();
    }
    cleanUpStaleExperiments() {
        const experimentsSetting = Runtime.experimentsSetting();
        const cleanedUpExperimentSetting = {};
        for (const { name: experimentName } of this.#experiments) {
            if (experimentsSetting.hasOwnProperty(experimentName)) {
                const isEnabled = experimentsSetting[experimentName];
                if (isEnabled || this.#enabledByDefault.has(experimentName)) {
                    cleanedUpExperimentSetting[experimentName] = isEnabled;
                }
            }
        }
        this.setExperimentsSetting(cleanedUpExperimentSetting);
    }
    checkExperiment(experimentName) {
        Runtime.assert(this.#experimentNames.has(experimentName), 'Unknown experiment ' + experimentName);
    }
}
export class Experiment {
    name;
    title;
    unstable;
    docLink;
    #experiments;
    constructor(experiments, name, title, unstable, docLink) {
        this.name = name;
        this.title = title;
        this.unstable = unstable;
        this.docLink = docLink;
        this.#experiments = experiments;
    }
    isEnabled() {
        return this.#experiments.isEnabled(this.name);
    }
    setEnabled(enabled) {
        this.#experiments.setEnabled(this.name, enabled);
    }
}
export function loadResourcePromise(url) {
    return new Promise(load);
    function load(fulfill, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = onreadystatechange;
        function onreadystatechange(_e) {
            if (xhr.readyState !== XMLHttpRequest.DONE) {
                return;
            }
            const response = this.response;
            // DevTools Proxy server can mask 404s as 200s, check the body to be sure
            const status = /^HTTP\/1.1 404/.test(response) ? 404 : xhr.status;
            if ([0, 200, 304].indexOf(status) === -1) // Testing harness file:/// results in 0.
             {
                reject(new Error('While loading from url ' + url + ' server responded with a status of ' + status));
            }
            else {
                fulfill(response);
            }
        }
        xhr.send(null);
    }
}
function getResourceURL(scriptName, base) {
    const sourceURL = (base || importScriptPathPrefix) + scriptName;
    const schemaIndex = sourceURL.indexOf('://') + 3;
    let pathIndex = sourceURL.indexOf('/', schemaIndex);
    if (pathIndex === -1) {
        pathIndex = sourceURL.length;
    }
    return sourceURL.substring(0, pathIndex) + Runtime.normalizePath(sourceURL.substring(pathIndex));
}
(function () {
    const baseUrl = self.location ? self.location.origin + self.location.pathname : '';
    importScriptPathPrefix = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
})();
// This must be constructed after the query parameters have been parsed.
export const experiments = new ExperimentsSupport();
export const cachedResources = new Map();
// Only exported for LightHouse, which uses it in `report-generator.js`.
// Do not use this global in DevTools' implementation.
// TODO(crbug.com/1127292): remove this global
// @ts-ignore
globalThis.EXPORTED_CACHED_RESOURCES_ONLY_FOR_LIGHTHOUSE = cachedResources;
export let appStartedPromiseCallback;
export const appStarted = new Promise(fulfill => {
    appStartedPromiseCallback = fulfill;
});
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var ExperimentName;
(function (ExperimentName) {
    ExperimentName["CAPTURE_NODE_CREATION_STACKS"] = "captureNodeCreationStacks";
    ExperimentName["CSS_OVERVIEW"] = "cssOverview";
    ExperimentName["LIVE_HEAP_PROFILE"] = "liveHeapProfile";
    ExperimentName["DEVELOPER_RESOURCES_VIEW"] = "developerResourcesView";
    ExperimentName["TIMELINE_REPLAY_EVENT"] = "timelineReplayEvent";
    ExperimentName["CSP_VIOLATIONS_VIEW"] = "cspViolationsView";
    ExperimentName["WASM_DWARF_DEBUGGING"] = "wasmDWARFDebugging";
    ExperimentName["ALL"] = "*";
    ExperimentName["PROTOCOL_MONITOR"] = "protocolMonitor";
    ExperimentName["WEBAUTHN_PANE"] = "webauthnPane";
    ExperimentName["SYNC_SETTINGS"] = "syncSettings";
})(ExperimentName || (ExperimentName = {}));
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var ConditionName;
(function (ConditionName) {
    ConditionName["CAN_DOCK"] = "can_dock";
    ConditionName["NOT_SOURCES_HIDE_ADD_FOLDER"] = "!sources.hide_add_folder";
})(ConditionName || (ConditionName = {}));
//# sourceMappingURL=Runtime.js.map