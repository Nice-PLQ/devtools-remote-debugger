import type * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import type * as Protocol from '../../generated/protocol.js';
import type * as TraceEngine from '../../models/trace/trace.js';
import { type TimelineModelFilter } from './TimelineModelFilter.js';
export declare class Node {
    totalTime: number;
    selfTime: number;
    id: string | symbol;
    event: SDK.TracingModel.CompatibleTraceEvent | null;
    parent: Node | null;
    groupId: string;
    isGroupNodeInternal: boolean;
    depth: number;
    constructor(id: string | symbol, event: SDK.TracingModel.CompatibleTraceEvent | null);
    isGroupNode(): boolean;
    hasChildren(): boolean;
    setHasChildren(_value: boolean): void;
    /**
     * Returns the direct descendants of this node.
     * @returns a map with ordered <nodeId, Node> tuples.
     */
    children(): ChildrenCache;
    searchTree(matchFunction: (arg0: SDK.TracingModel.CompatibleTraceEvent) => boolean, results?: Node[]): Node[];
}
export declare class TopDownNode extends Node {
    root: TopDownRootNode | null;
    private hasChildrenInternal;
    childrenInternal: ChildrenCache | null;
    parent: TopDownNode | null;
    constructor(id: string | symbol, event: SDK.TracingModel.CompatibleTraceEvent | null, parent: TopDownNode | null);
    hasChildren(): boolean;
    setHasChildren(value: boolean): void;
    children(): ChildrenCache;
    private buildChildren;
    getRoot(): TopDownRootNode | null;
}
export declare class TopDownRootNode extends TopDownNode {
    readonly filter: (e: SDK.TracingModel.CompatibleTraceEvent) => boolean;
    readonly events: SDK.TracingModel.CompatibleTraceEvent[];
    readonly startTime: number;
    readonly endTime: number;
    eventGroupIdCallback: ((arg0: SDK.TracingModel.CompatibleTraceEvent) => string) | null | undefined;
    readonly doNotAggregate: boolean | undefined;
    totalTime: number;
    selfTime: number;
    constructor(events: SDK.TracingModel.CompatibleTraceEvent[], filters: TimelineModelFilter[], startTime: number, endTime: number, doNotAggregate?: boolean, eventGroupIdCallback?: ((arg0: SDK.TracingModel.CompatibleTraceEvent) => string) | null);
    children(): ChildrenCache;
    private grouppedTopNodes;
    getEventGroupIdCallback(): ((arg0: SDK.TracingModel.CompatibleTraceEvent) => string) | null | undefined;
}
export declare class BottomUpRootNode extends Node {
    private childrenInternal;
    readonly events: SDK.TracingModel.CompatibleTraceEvent[];
    private textFilter;
    readonly filter: (e: SDK.TracingModel.CompatibleTraceEvent) => boolean;
    readonly startTime: number;
    readonly endTime: number;
    private eventGroupIdCallback;
    totalTime: number;
    constructor(events: SDK.TracingModel.CompatibleTraceEvent[], textFilter: TimelineModelFilter, filters: TimelineModelFilter[], startTime: number, endTime: number, eventGroupIdCallback: ((arg0: SDK.TracingModel.Event) => string) | null);
    hasChildren(): boolean;
    filterChildren(children: ChildrenCache): ChildrenCache;
    children(): ChildrenCache;
    private ungrouppedTopNodes;
    private grouppedTopNodes;
}
export declare class GroupNode extends Node {
    private readonly childrenInternal;
    isGroupNodeInternal: boolean;
    constructor(id: string, parent: BottomUpRootNode | TopDownRootNode, event: SDK.TracingModel.Event);
    addChild(child: BottomUpNode, selfTime: number, totalTime: number): void;
    hasChildren(): boolean;
    children(): ChildrenCache;
}
export declare class BottomUpNode extends Node {
    parent: Node;
    private root;
    depth: number;
    private cachedChildren;
    private hasChildrenInternal;
    constructor(root: BottomUpRootNode, id: string, event: SDK.TracingModel.CompatibleTraceEvent, hasChildren: boolean, parent: Node);
    hasChildren(): boolean;
    setHasChildren(value: boolean): void;
    children(): ChildrenCache;
    searchTree(matchFunction: (arg0: SDK.TracingModel.CompatibleTraceEvent) => boolean, results?: Node[]): Node[];
}
export declare function eventURL(event: SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData): Platform.DevToolsPath.UrlString | null;
export declare function eventStackFrame(event: SDK.TracingModel.Event | TraceEngine.Types.TraceEvents.TraceEventData): Protocol.Runtime.CallFrame | null;
export declare function _eventId(event: SDK.TracingModel.CompatibleTraceEvent): string;
export type ChildrenCache = Map<string | symbol, Node>;
