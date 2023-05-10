import type * as Bindings from '../../models/bindings/bindings.js';
import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import type * as Protocol from '../../generated/protocol.js';
export declare const enum CoverageType {
    CSS = 1,
    JavaScript = 2,
    JavaScriptPerFunction = 4
}
export declare const enum SuspensionState {
    Active = "Active",
    Suspending = "Suspending",
    Suspended = "Suspended"
}
export declare enum Events {
    CoverageUpdated = "CoverageUpdated",
    CoverageReset = "CoverageReset"
}
export declare type EventTypes = {
    [Events.CoverageUpdated]: CoverageInfo[];
    [Events.CoverageReset]: void;
};
export declare class CoverageModel extends SDK.SDKModel.SDKModel<EventTypes> {
    private cpuProfilerModel;
    private cssModel;
    private debuggerModel;
    private coverageByURL;
    private coverageByContentProvider;
    private coverageUpdateTimes;
    private suspensionState;
    private pollTimer;
    private currentPollPromise;
    private shouldResumePollingOnResume;
    private jsBacklog;
    private cssBacklog;
    private performanceTraceRecording;
    constructor(target: SDK.Target.Target);
    start(jsCoveragePerBlock: boolean): Promise<boolean>;
    preciseCoverageDeltaUpdate(timestamp: number, occasion: string, coverageData: Protocol.Profiler.ScriptCoverage[]): void;
    stop(): Promise<void>;
    reset(): void;
    startPolling(): Promise<void>;
    private pollLoop;
    stopPolling(): Promise<void>;
    private pollAndCallback;
    private clearTimer;
    /**
     * Stops polling as preparation for suspension. This function is idempotent
     * due because it changes the state to suspending.
     */
    preSuspendModel(reason?: string): Promise<void>;
    suspendModel(_reason?: string): Promise<void>;
    resumeModel(): Promise<void>;
    /**
     * Restarts polling after suspension. Note that the function is idempotent
     * because starting polling is idempotent.
     */
    postResumeModel(): Promise<void>;
    entries(): URLCoverageInfo[];
    getCoverageForUrl(url: string): URLCoverageInfo | null;
    usageForRange(contentProvider: TextUtils.ContentProvider.ContentProvider, startOffset: number, endOffset: number): boolean | undefined;
    private clearCSS;
    private takeAllCoverage;
    private takeJSCoverage;
    getCoverageUpdateTimes(): Set<number>;
    private backlogOrProcessJSCoverage;
    processJSBacklog(): Promise<void>;
    private processJSCoverage;
    private handleStyleSheetAdded;
    private takeCSSCoverage;
    private backlogOrProcessCSSCoverage;
    private processCSSCoverage;
    private static convertToDisjointSegments;
    private addStyleSheetToCSSCoverage;
    private addCoverage;
    exportReport(fos: Bindings.FileUtils.FileOutputStream): Promise<void>;
}
export interface EntryForExport {
    url: string;
    ranges: {
        start: number;
        end: number;
    }[];
    text: string | null;
}
export declare class URLCoverageInfo extends Common.ObjectWrapper.ObjectWrapper<URLCoverageInfo.EventTypes> {
    private readonly urlInternal;
    private coverageInfoByLocation;
    private sizeInternal;
    private usedSizeInternal;
    private typeInternal;
    private isContentScriptInternal;
    constructor(url: string);
    url(): string;
    type(): CoverageType;
    size(): number;
    usedSize(): number;
    unusedSize(): number;
    usedPercentage(): number;
    unusedPercentage(): number;
    isContentScript(): boolean;
    entries(): IterableIterator<CoverageInfo>;
    numberOfEntries(): number;
    removeCoverageEntry(key: string, entry: CoverageInfo): void;
    addToSizes(usedSize: number, size: number): void;
    ensureEntry(contentProvider: TextUtils.ContentProvider.ContentProvider, contentLength: number, lineOffset: number, columnOffset: number, type: CoverageType): CoverageInfo;
    getFullText(): Promise<TextUtils.Text.Text | null>;
    entriesForExportBasedOnFullText(fullText: TextUtils.Text.Text): EntryForExport;
    entriesForExportBasedOnContent(): Promise<EntryForExport[]>;
    entriesForExport(): Promise<EntryForExport[]>;
}
export declare namespace URLCoverageInfo {
    enum Events {
        SizesChanged = "SizesChanged"
    }
    type EventTypes = {
        [Events.SizesChanged]: void;
    };
}
export declare const mergeSegments: (segmentsA: CoverageSegment[], segmentsB: CoverageSegment[]) => CoverageSegment[];
export declare class CoverageInfo {
    private contentProvider;
    private size;
    private usedSize;
    private statsByTimestamp;
    private lineOffset;
    private columnOffset;
    private coverageType;
    private segments;
    constructor(contentProvider: TextUtils.ContentProvider.ContentProvider, size: number, lineOffset: number, columnOffset: number, type: CoverageType);
    getContentProvider(): TextUtils.ContentProvider.ContentProvider;
    url(): string;
    type(): CoverageType;
    addCoverageType(type: CoverageType): void;
    getOffsets(): {
        lineOffset: number;
        columnOffset: number;
    };
    /**
     * Returns the delta by which usedSize increased.
     */
    mergeCoverage(segments: CoverageSegment[]): number;
    usedByTimestamp(): Map<number, number>;
    getSize(): number;
    getUsedSize(): number;
    usageForRange(start: number, end: number): boolean;
    private updateStats;
    rangesForExport(offset?: number): {
        start: number;
        end: number;
    }[];
}
export interface RangeUseCount {
    startOffset: number;
    endOffset: number;
    count: number;
}
export interface CoverageSegment {
    end: number;
    count: number;
    stamp: number;
}
