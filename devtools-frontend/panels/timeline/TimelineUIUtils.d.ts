import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../models/trace/trace.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Protocol from '../../generated/protocol.js';
type LinkifyLocationOptions = {
    scriptId: Protocol.Runtime.ScriptId | null;
    url: string;
    lineNumber: number;
    columnNumber?: number;
    isFreshRecording?: boolean;
    target: SDK.Target.Target | null;
    linkifier: Components.Linkifier.Linkifier;
};
export declare class TimelineUIUtils {
    private static initEventStyles;
    static setEventStylesMap(eventStyles: any): void;
    static frameDisplayName(frame: Protocol.Runtime.CallFrame): string;
    static testContentMatching(traceEvent: SDK.TracingModel.CompatibleTraceEvent, regExp: RegExp): boolean;
    static eventURL(event: SDK.TracingModel.Event): Platform.DevToolsPath.UrlString | null;
    static eventStyle(event: SDK.TracingModel.CompatibleTraceEvent): TimelineRecordStyle;
    static eventColor(event: SDK.TracingModel.Event): string;
    static eventTitle(event: SDK.TracingModel.CompatibleTraceEvent): string;
    static isUserFrame(frame: Protocol.Runtime.CallFrame): boolean;
    static networkRequestCategory(request: TimelineModel.TimelineModel.NetworkRequest): NetworkCategory;
    static networkCategoryColor(category: NetworkCategory): string;
    static buildDetailsTextForTraceEvent(event: SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData): Promise<string | null>;
    static buildDetailsNodeForTraceEvent(event: SDK.TracingModel.CompatibleTraceEvent, target: SDK.Target.Target | null, linkifier: Components.Linkifier.Linkifier, isFreshRecording?: boolean): Promise<Node | null>;
    static linkifyLocation(linkifyOptions: LinkifyLocationOptions): Element | null;
    static linkifyTopCallFrame(event: SDK.TracingModel.CompatibleTraceEvent, target: SDK.Target.Target | null, linkifier: Components.Linkifier.Linkifier, isFreshRecording?: boolean): Element | null;
    static buildDetailsNodeForPerformanceEvent(event: SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData): Element;
    static buildConsumeCacheDetails(eventData: {
        consumedCacheSize?: number;
        cacheRejected?: boolean;
    }, contentHelper: TimelineDetailsContentHelper): void;
    static buildTraceEventDetails(event: SDK.TracingModel.CompatibleTraceEvent, model: TimelineModel.TimelineModel.TimelineModelImpl, linkifier: Components.Linkifier.Linkifier, detailed: boolean, traceParseData?: TraceEngine.Handlers.Migration.PartialTraceData | null): Promise<DocumentFragment>;
    static statsForTimeRange(events: SDK.TracingModel.CompatibleTraceEvent[], startTime: number, endTime: number): {
        [x: string]: number;
    };
    static buildNetworkRequestDetails(request: TimelineModel.TimelineModel.NetworkRequest, model: TimelineModel.TimelineModel.TimelineModelImpl, linkifier: Components.Linkifier.Linkifier): Promise<DocumentFragment>;
    static stackTraceFromCallFrames(callFrames: Protocol.Runtime.CallFrame[]): Protocol.Runtime.StackTrace;
    private static generateCauses;
    private static generateInvalidations;
    private static generateInvalidationsForType;
    private static collectInvalidationNodeIds;
    private static aggregatedStatsForTraceEvent;
    static buildPicturePreviewContent(event: SDK.TracingModel.Event, target: SDK.Target.Target): Promise<Element | null>;
    static createEventDivider(event: SDK.TracingModel.Event, zeroTime: number): Element;
    static visibleTypes(): string[];
    static visibleEventsFilter(): TimelineModel.TimelineModelFilter.TimelineModelFilter;
    static categories(): {
        [x: string]: TimelineCategory;
    };
    static setCategories(cats: {
        [x: string]: TimelineCategory;
    }): void;
    static getTimelineMainEventCategories(): string[];
    static setTimelineMainEventCategories(categories: string[]): void;
    static generatePieChart(aggregatedStats: {
        [x: string]: number;
    }, selfCategory?: TimelineCategory, selfTime?: number): Element;
    static generateDetailsContentForFrame(frame: TimelineModel.TimelineFrameModel.TimelineFrame, filmStripFrame: SDK.FilmStripModel.Frame | null): DocumentFragment;
    static frameDuration(frame: TimelineModel.TimelineFrameModel.TimelineFrame): Element;
    static quadWidth(quad: number[]): number;
    static quadHeight(quad: number[]): number;
    static eventDispatchDesciptors(): EventDispatchTypeDescriptor[];
    static markerShortTitle(event: SDK.TracingModel.Event): string | null;
    static markerStyleForEvent(event: SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData): TimelineMarkerStyle;
    static colorForId(id: string): string;
    static eventWarning(event: SDK.TracingModel.CompatibleTraceEvent, warningType?: string): Element | null;
    static displayNameForFrame(frame: TimelineModel.TimelineModel.PageFrame, trimAt?: number): string;
}
export declare class TimelineRecordStyle {
    title: string;
    category: TimelineCategory;
    hidden: boolean;
    constructor(title: string, category: TimelineCategory, hidden?: boolean | undefined);
}
export declare enum NetworkCategory {
    HTML = "HTML",
    Script = "Script",
    Style = "Style",
    Media = "Media",
    Other = "Other"
}
export declare const aggregatedStatsKey: unique symbol;
export declare class InvalidationsGroupElement extends UI.TreeOutline.TreeElement {
    toggleOnClick: boolean;
    private readonly relatedNodesMap;
    private readonly contentHelper;
    private readonly invalidations;
    constructor(target: SDK.Target.Target, relatedNodesMap: Map<number, SDK.DOMModel.DOMNode | null> | null, contentHelper: TimelineDetailsContentHelper, invalidations: TimelineModel.TimelineModel.InvalidationTrackingEvent[]);
    private createTitle;
    onpopulate(): Promise<void>;
    private getTruncatedNodesElement;
    private createInvalidationNode;
}
export declare const previewElementSymbol: unique symbol;
export declare class EventDispatchTypeDescriptor {
    priority: number;
    color: string;
    eventTypes: string[];
    constructor(priority: number, color: string, eventTypes: string[]);
}
export declare class TimelineCategory {
    name: string;
    title: string;
    visible: boolean;
    childColor: string;
    color: string;
    private hiddenInternal?;
    constructor(name: string, title: string, visible: boolean, childColor: string, color: string);
    get hidden(): boolean;
    set hidden(hidden: boolean);
}
export declare class TimelineDetailsContentHelper {
    fragment: DocumentFragment;
    private linkifierInternal;
    private target;
    element: HTMLDivElement;
    private tableElement;
    constructor(target: SDK.Target.Target | null, linkifier: Components.Linkifier.Linkifier | null);
    addSection(title: string, swatchColor?: string): void;
    linkifier(): Components.Linkifier.Linkifier | null;
    appendTextRow(title: string, value: string | number | boolean): void;
    appendElementRow(title: string, content: string | Node, isWarning?: boolean, isStacked?: boolean): void;
    appendLocationRow(title: string, url: string, startLine: number, startColumn?: number): void;
    appendLocationRange(title: string, url: Platform.DevToolsPath.UrlString, startLine: number, endLine?: number): void;
    appendStackTrace(title: string, stackTrace: Protocol.Runtime.StackTrace): void;
    createChildStackTraceElement(parentElement: Element, stackTrace: Protocol.Runtime.StackTrace): void;
    appendWarningRow(event: SDK.TracingModel.CompatibleTraceEvent, warningType?: string): void;
}
export declare const categoryBreakdownCacheSymbol: unique symbol;
export interface TimelineMarkerStyle {
    title: string;
    color: string;
    lineWidth: number;
    dashStyle: number[];
    tall: boolean;
    lowPriority: boolean;
}
/**
 * Given a particular event, this method can adjust its timestamp by
 * substracting the timestamp of the previous navigation. This helps in cases
 * where the user has navigated multiple times in the trace, so that we can show
 * the LCP (for example) relative to the last navigation.
 *
 * Currently this helper lives here and can deal with legacy events or new
 * events, preferring to use the new engine's data structure if possible. In the
 * future, once the old engine is removed, we can move this method into the
 * TraceEngine helpers, and not have it take the legacy model.
 **/
export declare function timeStampForEventAdjustedForClosestNavigationIfPossible(event: SDK.TracingModel.CompatibleTraceEvent, model: TimelineModel.TimelineModel.TimelineModelImpl, traceParsedData: TraceEngine.Handlers.Migration.PartialTraceData | null): TraceEngine.Types.Timing.MilliSeconds;
export {};
