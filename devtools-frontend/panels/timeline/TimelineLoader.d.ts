import * as Common from '../../core/common/common.js';
import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
/**
 * This class handles loading traces from file and URL, and from the Lighthouse panel
 * It also handles loading cpuprofiles from file, url and console.profileEnd()
 *
 * Meanwhile, the normal trace recording flow bypasses TimelineLoader entirely,
 * as it's handled from TracingManager => TimelineController.
 */
export declare class TimelineLoader implements Common.StringOutputStream.OutputStream {
    private client;
    private tracingModel;
    private canceledCallback;
    private state;
    private buffer;
    private firstRawChunk;
    private firstChunk;
    private loadedBytes;
    private totalSize;
    private readonly jsonTokenizer;
    private filter;
    constructor(client: Client, title?: string);
    static loadFromFile(file: File, client: Client): Promise<TimelineLoader>;
    static loadFromEvents(events: SDK.TracingManager.EventPayload[], client: Client): TimelineLoader;
    static getCpuProfileFilter(): TimelineModel.TimelineModelFilter.TimelineVisibleEventsFilter;
    static loadFromCpuProfile(profile: Protocol.Profiler.Profile | null, client: Client, title?: string): TimelineLoader;
    static loadFromURL(url: Platform.DevToolsPath.UrlString, client: Client): Promise<TimelineLoader>;
    addEvents(events: SDK.TracingManager.EventPayload[]): Promise<void>;
    cancel(): Promise<void>;
    write(chunk: string): Promise<void>;
    private writeBalancedJSON;
    private reportErrorAndCancelLoading;
    private looksLikeAppVersion;
    close(): Promise<void>;
    private finalizeTrace;
    private parseCPUProfileFormat;
}
export declare const TransferChunkLengthBytes = 5000000;
export interface Client {
    loadingStarted(): Promise<void>;
    loadingProgress(progress?: number): Promise<void>;
    processingStarted(): Promise<void>;
    loadingComplete(tracingModel: SDK.TracingModel.TracingModel | null, exclusiveFilter: TimelineModel.TimelineModelFilter.TimelineModelFilter | null): Promise<void>;
}
export declare enum State {
    Initial = "Initial",
    LookingForEvents = "LookingForEvents",
    ReadingEvents = "ReadingEvents",
    SkippingTail = "SkippingTail",
    LoadingCPUProfileFormat = "LoadingCPUProfileFormat"
}
