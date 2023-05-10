export declare function getRemoteBase(location?: string): {
    base: string;
    version: string;
} | null;
export declare const mappingForLayoutTests: Map<string, string>;
export declare class Runtime {
    #private;
    modulesMap: {
        [x: string]: Module;
    };
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
        moduleDescriptors: Array<ModuleDescriptor> | null;
    } | undefined): Runtime;
    static removeInstance(): void;
    /**
     * http://tools.ietf.org/html/rfc3986#section-5.2.4
     */
    static normalizePath(path: string): string;
    static queryParam(name: string): string | null;
    static experimentsSetting(): {
        [x: string]: boolean;
    };
    static assert(value: boolean | undefined, message: string): void;
    static setPlatform(platform: string): void;
    static platform(): string;
    static isDescriptorEnabled(descriptor: {
        experiment: ((string | undefined) | null);
        condition: ((string | undefined) | null);
    }): boolean;
    static resolveSourceURL(path: string): string;
    module(moduleName: string): Module;
    private registerModule;
    loadModulePromise(moduleName: string): Promise<boolean>;
    loadAutoStartModules(moduleNames: string[]): Promise<boolean[]>;
    getModulesMap(): {
        [x: string]: Module;
    };
}
export declare class ModuleDescriptor {
    name: string;
    dependencies: string[] | undefined;
    modules: string[];
    resources: string[];
    condition: string | undefined;
    experiment: string | null;
    constructor();
}
export interface Option {
    title: string;
    value: string | boolean;
    raw?: boolean;
    text?: string;
}
export declare class Module {
    #private;
    readonly descriptor: ModuleDescriptor;
    constructor(manager: Runtime, descriptor: ModuleDescriptor);
    name(): string;
    enabled(): boolean;
    resource(name: string): string;
    loadPromise(): Promise<boolean>;
    private loadModules;
    private modularizeURL;
    fetchResource(resourceName: string): Promise<string>;
}
export declare class ExperimentsSupport {
    #private;
    constructor();
    allConfigurableExperiments(): Experiment[];
    enabledExperiments(): Experiment[];
    private setExperimentsSetting;
    register(experimentName: string, experimentTitle: string, unstable?: boolean, docLink?: string): void;
    isEnabled(experimentName: string): boolean;
    setEnabled(experimentName: string, enabled: boolean): void;
    enableExperimentsTransiently(experimentNames: string[]): void;
    enableExperimentsByDefault(experimentNames: string[]): void;
    setServerEnabledExperiments(experimentNames: string[]): void;
    enableForTest(experimentName: string): void;
    clearForTest(): void;
    cleanUpStaleExperiments(): void;
    private checkExperiment;
}
export declare class Experiment {
    #private;
    name: string;
    title: string;
    unstable: boolean;
    docLink?: string;
    constructor(experiments: ExperimentsSupport, name: string, title: string, unstable: boolean, docLink: string);
    isEnabled(): boolean;
    setEnabled(enabled: boolean): void;
}
export declare function loadResourcePromise(url: string): Promise<string>;
export declare const experiments: ExperimentsSupport;
export declare const cachedResources: Map<string, string>;
export declare let appStartedPromiseCallback: () => void;
export declare const appStarted: Promise<void>;
export declare enum ExperimentName {
    CAPTURE_NODE_CREATION_STACKS = "captureNodeCreationStacks",
    CSS_OVERVIEW = "cssOverview",
    LIVE_HEAP_PROFILE = "liveHeapProfile",
    DEVELOPER_RESOURCES_VIEW = "developerResourcesView",
    TIMELINE_REPLAY_EVENT = "timelineReplayEvent",
    CSP_VIOLATIONS_VIEW = "cspViolationsView",
    WASM_DWARF_DEBUGGING = "wasmDWARFDebugging",
    ALL = "*",
    PROTOCOL_MONITOR = "protocolMonitor",
    WEBAUTHN_PANE = "webauthnPane",
    SYNC_SETTINGS = "syncSettings"
}
export declare enum ConditionName {
    CAN_DOCK = "can_dock",
    NOT_SOURCES_HIDE_ADD_FOLDER = "!sources.hide_add_folder"
}
