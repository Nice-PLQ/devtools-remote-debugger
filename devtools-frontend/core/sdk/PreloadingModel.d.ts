import * as Protocol from '../../generated/protocol.js';
import { SDKModel } from './SDKModel.js';
import { type Target } from './Target.js';
export interface WithId<I, V> {
    id: I;
    value: V;
}
export declare class PreloadingModel extends SDKModel<EventTypes> {
    private agent;
    private loaderIds;
    private targetJustAttached;
    private lastPrimaryPageModel;
    private documents;
    private getFeatureFlagsPromise;
    constructor(target: Target);
    dispose(): void;
    private ensureDocumentPreloadingData;
    private currentLoaderId;
    private currentDocument;
    getRuleSetById(id: Protocol.Preload.RuleSetId): Protocol.Preload.RuleSet | null;
    getAllRuleSets(): WithId<Protocol.Preload.RuleSetId, Protocol.Preload.RuleSet>[];
    getPreloadingAttemptById(id: PreloadingAttemptId): PreloadingAttempt | null;
    getPreloadingAttempts(ruleSetId: Protocol.Preload.RuleSetId | null): WithId<PreloadingAttemptId, PreloadingAttempt>[];
    getPreloadingAttemptsOfPreviousPage(): WithId<PreloadingAttemptId, PreloadingAttempt>[];
    private onPrimaryPageChanged;
    onRuleSetUpdated(event: Protocol.Preload.RuleSetUpdatedEvent): void;
    onRuleSetRemoved(event: Protocol.Preload.RuleSetRemovedEvent): void;
    onPreloadingAttemptSourcesUpdated(event: Protocol.Preload.PreloadingAttemptSourcesUpdatedEvent): void;
    onPrefetchStatusUpdated(event: Protocol.Preload.PrefetchStatusUpdatedEvent): void;
    onPrerenderStatusUpdated(event: Protocol.Preload.PrerenderStatusUpdatedEvent): void;
    private getFeatureFlags;
    onPreloadEnabledStateUpdated(event: Protocol.Preload.PreloadEnabledStateUpdatedEvent): Promise<void>;
}
export declare enum Events {
    ModelUpdated = "ModelUpdated",
    WarningsUpdated = "WarningsUpdated"
}
export type EventTypes = {
    [Events.ModelUpdated]: void;
    [Events.WarningsUpdated]: PreloadWarnings;
};
export declare const enum PreloadingStatus {
    NotTriggered = "NotTriggered",
    Pending = "Pending",
    Running = "Running",
    Ready = "Ready",
    Success = "Success",
    Failure = "Failure",
    NotSupported = "NotSupported"
}
export type PreloadingAttemptId = string;
export type PreloadingAttempt = PrefetchAttempt | PrerenderAttempt;
export interface PrefetchAttempt {
    action: Protocol.Preload.SpeculationAction.Prefetch;
    key: Protocol.Preload.PreloadingAttemptKey;
    status: PreloadingStatus;
    prefetchStatus: Protocol.Preload.PrefetchStatus | null;
    ruleSetIds: Protocol.Preload.RuleSetId[];
    nodeIds: Protocol.DOM.BackendNodeId[];
}
export interface PrerenderAttempt {
    action: Protocol.Preload.SpeculationAction.Prerender;
    key: Protocol.Preload.PreloadingAttemptKey;
    status: PreloadingStatus;
    prerenderStatus: Protocol.Preload.PrerenderFinalStatus | null;
    ruleSetIds: Protocol.Preload.RuleSetId[];
    nodeIds: Protocol.DOM.BackendNodeId[];
}
export type PreloadingAttemptInternal = PrefetchAttemptInternal | PrerenderAttemptInternal;
export interface PrefetchAttemptInternal {
    action: Protocol.Preload.SpeculationAction.Prefetch;
    key: Protocol.Preload.PreloadingAttemptKey;
    status: PreloadingStatus;
    prefetchStatus: Protocol.Preload.PrefetchStatus | null;
}
export interface PrerenderAttemptInternal {
    action: Protocol.Preload.SpeculationAction.Prerender;
    key: Protocol.Preload.PreloadingAttemptKey;
    status: PreloadingStatus;
    prerenderStatus: Protocol.Preload.PrerenderFinalStatus | null;
}
export interface PreloadWarnings {
    featureFlagPreloadingHoldback: boolean;
    featureFlagPrerender2Holdback: boolean;
    disabledByPreference: boolean;
    disabledByDataSaver: boolean;
    disabledByBatterySaver: boolean;
}
