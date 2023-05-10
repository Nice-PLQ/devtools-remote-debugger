import * as HeapSnapshotModel from '../../models/heap_snapshot_model/heap_snapshot_model.js';
export declare class AllocationProfile {
    private readonly strings;
    private readonly liveObjectStats;
    private nextNodeId;
    private functionInfos;
    private idToNode;
    private readonly idToTopDownNode;
    private collapsedTopNodeIdToFunctionInfo;
    private traceTops;
    private readonly traceTree;
    constructor(profile: any, liveObjectStats: any);
    private buildFunctionAllocationInfos;
    private buildAllocationTree;
    serializeTraceTops(): HeapSnapshotModel.HeapSnapshotModel.SerializedAllocationNode[];
    serializeCallers(nodeId: number): HeapSnapshotModel.HeapSnapshotModel.AllocationNodeCallers;
    serializeAllocationStack(traceNodeId: number): HeapSnapshotModel.HeapSnapshotModel.AllocationStackFrame[];
    traceIds(allocationNodeId: number): number[];
    private ensureBottomUpNode;
    private serializeCaller;
    private serializeNode;
}
export declare class TopDownAllocationNode {
    id: number;
    functionInfo: FunctionAllocationInfo;
    allocationCount: number;
    allocationSize: number;
    liveCount: number;
    liveSize: number;
    parent: TopDownAllocationNode | null;
    children: TopDownAllocationNode[];
    constructor(id: number, functionInfo: FunctionAllocationInfo, count: number, size: number, liveCount: number, liveSize: number, parent: TopDownAllocationNode | null);
}
export declare class BottomUpAllocationNode {
    functionInfo: FunctionAllocationInfo;
    allocationCount: number;
    allocationSize: number;
    liveCount: number;
    liveSize: number;
    traceTopIds: number[];
    private readonly callersInternal;
    constructor(functionInfo: FunctionAllocationInfo);
    addCaller(traceNode: TopDownAllocationNode): BottomUpAllocationNode;
    callers(): BottomUpAllocationNode[];
    hasCallers(): boolean;
}
export declare class FunctionAllocationInfo {
    functionName: string;
    scriptName: string;
    scriptId: number;
    line: number;
    column: number;
    totalCount: number;
    totalSize: number;
    totalLiveCount: number;
    totalLiveSize: number;
    private traceTops;
    private bottomUpTree?;
    constructor(functionName: string, scriptName: string, scriptId: number, line: number, column: number);
    addTraceTopNode(node: TopDownAllocationNode): void;
    bottomUpRoot(): BottomUpAllocationNode | null;
    private buildAllocationTraceTree;
}
