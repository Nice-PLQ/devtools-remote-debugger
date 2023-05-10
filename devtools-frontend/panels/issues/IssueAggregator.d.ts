import * as Common from '../../core/common/common.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import type * as Protocol from '../../generated/protocol.js';
declare type AggregationKeyTag = {
    aggregationKeyTag: undefined;
};
/**
 * An opaque type for the key which we use to aggregate issues. The key must be
 * chosen such that if two aggregated issues have the same aggregation key, then
 * they also have the same issue code.
 */
export declare type AggregationKey = {
    toString(): string;
} & AggregationKeyTag;
/**
 * An `AggregatedIssue` representes a number of `IssuesManager.Issue.Issue` objects that are displayed together.
 * Currently only grouping by issue code, is supported. The class provides helpers to support displaying
 * of all resources that are affected by the aggregated issues.
 */
export declare class AggregatedIssue extends IssuesManager.Issue.Issue {
    private affectedCookies;
    private affectedRawCookieLines;
    private affectedRequests;
    private affectedLocations;
    private heavyAdIssues;
    private blockedByResponseDetails;
    private corsIssues;
    private cspIssues;
    private issueKind;
    private lowContrastIssues;
    private mixedContentIssues;
    private sharedArrayBufferIssues;
    private trustedWebActivityIssues;
    private quirksModeIssues;
    private attributionReportingIssues;
    private wasmCrossOriginModuleSharingIssues;
    private genericIssues;
    private representative?;
    private aggregatedIssuesCount;
    private key;
    constructor(code: string, aggregationKey: AggregationKey);
    primaryKey(): string;
    aggregationKey(): AggregationKey;
    getBlockedByResponseDetails(): Iterable<Protocol.Audits.BlockedByResponseIssueDetails>;
    cookies(): Iterable<Protocol.Audits.AffectedCookie>;
    getRawCookieLines(): Iterable<{
        rawCookieLine: string;
        hasRequest: boolean;
    }>;
    sources(): Iterable<Protocol.Audits.SourceCodeLocation>;
    cookiesWithRequestIndicator(): Iterable<{
        cookie: Protocol.Audits.AffectedCookie;
        hasRequest: boolean;
    }>;
    getHeavyAdIssues(): Iterable<IssuesManager.HeavyAdIssue.HeavyAdIssue>;
    getMixedContentIssues(): Iterable<IssuesManager.MixedContentIssue.MixedContentIssue>;
    getTrustedWebActivityIssues(): Iterable<IssuesManager.TrustedWebActivityIssue.TrustedWebActivityIssue>;
    getCorsIssues(): Set<IssuesManager.CorsIssue.CorsIssue>;
    getCspIssues(): Iterable<IssuesManager.ContentSecurityPolicyIssue.ContentSecurityPolicyIssue>;
    getLowContrastIssues(): Iterable<IssuesManager.LowTextContrastIssue.LowTextContrastIssue>;
    requests(): Iterable<Protocol.Audits.AffectedRequest>;
    getSharedArrayBufferIssues(): Iterable<IssuesManager.SharedArrayBufferIssue.SharedArrayBufferIssue>;
    getQuirksModeIssues(): Iterable<IssuesManager.QuirksModeIssue.QuirksModeIssue>;
    getAttributionReportingIssues(): ReadonlySet<IssuesManager.AttributionReportingIssue.AttributionReportingIssue>;
    getWasmCrossOriginModuleSharingIssue(): ReadonlySet<IssuesManager.WasmCrossOriginModuleSharingIssue.WasmCrossOriginModuleSharingIssue>;
    getGenericIssues(): ReadonlySet<IssuesManager.GenericIssue.GenericIssue>;
    getDescription(): IssuesManager.MarkdownIssueDescription.MarkdownIssueDescription | null;
    getCategory(): IssuesManager.Issue.IssueCategory;
    getAggregatedIssuesCount(): number;
    /**
     * Produces a primary key for a cookie. Use this instead of `JSON.stringify` in
     * case new fields are added to `AffectedCookie`.
     */
    private keyForCookie;
    addInstance(issue: IssuesManager.Issue.Issue): void;
    getKind(): IssuesManager.Issue.IssueKind;
    isHidden(): boolean;
    setHidden(_value: boolean): void;
}
export declare class IssueAggregator extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
    private readonly issuesManager;
    private readonly aggregatedIssuesByKey;
    private readonly hiddenAggregatedIssuesByKey;
    constructor(issuesManager: IssuesManager.IssuesManager.IssuesManager);
    private onIssueAdded;
    private onFullUpdateRequired;
    private aggregateIssue;
    private aggregateIssueByStatus;
    aggregatedIssues(): Iterable<AggregatedIssue>;
    hiddenAggregatedIssues(): Iterable<AggregatedIssue>;
    aggregatedIssueCodes(): Set<AggregationKey>;
    aggregatedIssueCategories(): Set<IssuesManager.Issue.IssueCategory>;
    aggregatedIssueKinds(): Set<IssuesManager.Issue.IssueKind>;
    numberOfAggregatedIssues(): number;
    numberOfHiddenAggregatedIssues(): number;
    keyForIssue(issue: IssuesManager.Issue.Issue<string>): AggregationKey;
}
export declare const enum Events {
    AggregatedIssueUpdated = "AggregatedIssueUpdated",
    FullUpdateRequired = "FullUpdateRequired"
}
export declare type EventTypes = {
    [Events.AggregatedIssueUpdated]: AggregatedIssue;
    [Events.FullUpdateRequired]: void;
};
export {};
