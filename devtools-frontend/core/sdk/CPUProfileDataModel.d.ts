import type * as Protocol from '../../generated/protocol.js';
import { ProfileNode, ProfileTreeModel } from './ProfileTreeModel.js';
import { type Target } from './Target.js';
export declare class CPUProfileNode extends ProfileNode {
    id: number;
    self: number;
    positionTicks: Protocol.Profiler.PositionTickInfo[] | undefined;
    deoptReason: string | null;
    constructor(node: Protocol.Profiler.ProfileNode, sampleTime: number, target: Target | null);
}
export declare class CPUProfileDataModel extends ProfileTreeModel {
    #private;
    profileStartTime: number;
    profileEndTime: number;
    timestamps: number[];
    samples: number[] | undefined;
    lines: any;
    totalHitCount: number;
    profileHead: CPUProfileNode;
    gcNode: CPUProfileNode;
    programNode?: ProfileNode;
    idleNode?: ProfileNode;
    constructor(profile: Protocol.Profiler.Profile, target: Target | null);
    private compatibilityConversionHeadToNodes;
    private convertTimeDeltas;
    /**
     * Creates a Tree of CPUProfileNodes using the Protocol.Profiler.ProfileNodes.
     * As the tree is built, samples of native code (prefixed with "native ") are
     * filtered out. Samples of filtered nodes are replaced with the parent of the
     * node being filtered.
     *
     * This function supports legacy and new definitions of the CDP Profiler.Profile
     * type as well as the type of a CPU profile contained in trace events.
     */
    private translateProfileTree;
    /**
     * Sorts the samples array using the timestamps array (there is a one
     * to one matching by index between the two).
     */
    private sortSamples;
    /**
     * Fills in timestamps and/or time deltas from legacy profiles where
     * they could be missing.
     */
    private normalizeTimestamps;
    private extractMetaNodes;
    private fixMissingSamples;
    forEachFrame(openFrameCallback: (arg0: number, arg1: CPUProfileNode, arg2: number) => void, closeFrameCallback: (arg0: number, arg1: CPUProfileNode, arg2: number, arg3: number, arg4: number) => void, startTime?: number, stopTime?: number): void;
    /**
     * Returns the node that corresponds to a given index of a sample.
     */
    nodeByIndex(index: number): CPUProfileNode | null;
    nodes(): CPUProfileNode[] | null;
}
