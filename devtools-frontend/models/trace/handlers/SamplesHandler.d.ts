import * as Types from '../types/types.js';
import { EventCategory } from './types.js';
/**
 * Sorts samples in place, in order, by their start time.
 */
export declare function sortProfileSamples(samples: ProfileSample[]): void;
export declare function reset(): void;
export declare function initialize(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function finalize(): Promise<void>;
export declare function data(): SamplesHandlerData;
/**
 * Builds processes and threads from the accumulated profile chunks. This is
 * done during finalize instead of during event handling because profile heads
 * and chunks are sometimes retrieved out of order, or are incomplete.
 */
export declare function buildProcessesAndThreads(profiles: Map<Types.TraceEvents.ProfileID, Partial<SamplesProfile>>, processes: Map<Types.TraceEvents.ProcessID, SamplesProcess>): void;
/**
 * Converts the raw profile data into hierarchical and ordered structures from
 * the stack traces that were sampled during a recording. Each thread in each
 * process will contribute to their own individual profile.
 *
 * Our V8 profiler is a sampling profiler. This means that it probes the
 * program's call stack at regular intervals defined by the sampling frequency.
 * The raw profile data comes in as multiple events, from which a profile is
 * built.
 *
 * The generated data will be comprised of several parts:
 * 1. "tree": All the complete stack traces, represented by a tree whose roots
 *    are the bottomest stack frames of all stack traces.
 * 2. "samples": All the individual samples, as an ordered list where each item
 *    points to the topmost stack frame at a particular point in time.
 * 3. "calls": A list of profile calls, where each item represents multiple
 *    samples coalesced into a contiguous event. Each item will have a
 *    timestamp, duration, and refer to a stack frame and its child frames
 *    (all together forming multiple stack traces).
 */
export declare function buildHierarchy(processes: Map<Types.TraceEvents.ProcessID, SamplesProcess>, events: Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventComplete[]>>): void;
/**
 * Builds an array of timestamps corresponding to the begin and end boundaries
 * of the events on the specified process and thread.
 *
 * Therefore we expect to reformulate a set of events which can be represented
 * hierarchically like:
 *
 * |=========== Task A ===============|== Task E ==|
 *   |=== Task B ===|== Task D ==|
 *     |= Task C =|
 *
 * ...into something ordered like below:
 *
 * | | |          | |                 |            |
 * |=========== Task A ===============|== Task E ==|
 * | |=== Task B ===|== Task D ==|    |            |
 * | | |= Task C =| |            |    |            |
 * | | |          | |            |    |            |
 * X X X          X X            X    X            X (boundaries)
 */
export declare function collectBoundaries(events: Map<Types.TraceEvents.ProcessID, Map<Types.TraceEvents.ThreadID, Types.TraceEvents.TraceEventComplete[]>>, pid: Types.TraceEvents.ProcessID, tid: Types.TraceEvents.ThreadID, options: {
    filter: {
        has: (category: EventCategory) => boolean;
    };
}): Types.Timing.MicroSeconds[];
/**
 * Builds all the complete stack traces that exist in a particular thread of a
 * particular process. They will be stored as a tree. The roots of this tree are
 * the bottomest stack frames of all individual stack traces.
 *
 * The stack traces are retrieved in partial chains, each chain as part of a
 * trace event. This method collects the data into a single tree.
 *
 * Therefore we expect to reformulate something like:
 *
 * Chain 1: [A, B <- A, C <- B]
 * Chain 2: [D <- A, E <- D]
 * Chain 3: [G]
 * Chain 4: [F <- B]
 * Chain 5: [H <- G, I <- H]
 *
 * ...into something hierarchically-arranged like below:
 *
 *     A       G
 *    / \      |
 *   B   D     H
 *  / \   \    |
 * C   F   E   I
 */
export declare function collectStackTraces(chunks: Types.TraceEvents.TraceEventProfileChunk[], options?: {
    filterCodeTypes: boolean;
    filterUrls: boolean;
}): ProfileTree;
/**
 * Collects all the individual samples that exist in a particular thread of a
 * particular process. They will be stored as an ordered list. Each entry
 * represents a sampled stack trace by pointing to the topmost stack frame at
 * that particular time.
 *
 * The samples are retrieved in buckets, each bucket as part of a trace event,
 * and each sample at a positive or negative delta cumulatively relative to the
 * profile's start time. This method collects the data into a single list.
 *
 * Therefore we expect to reformulate something like:
 *
 * Event 1 at 0µs: [A at Δ+1µs, A at Δ+2µs, B at Δ-1µs, C at Δ+2µs]
 * Event 2 at 9µs: [A at Δ+1µs, D at Δ+9µs, E at Δ-1µs]
 *
 * ...where each sample in each event points to the tompost stack frame at that
 * particular point in time (e.g. the first sample's tompost stack frame is A),
 * into something ordered like below:
 *
 * [A at 1µs, B at 2µs, A at 3µs, C at 4µs, A at 10µs, E at 18µs, D at 19µs]
 *
 * ...where each sample has an absolute timestamp, and the list is ordered.
 */
export declare function collectSamples(pid: Types.TraceEvents.ProcessID, tid: Types.TraceEvents.ThreadID, ts: Types.Timing.MicroSeconds, tree: ProfileTree, chunks: Types.TraceEvents.TraceEventProfileChunk[], options?: {
    filterCodeTypes: boolean;
    filterUrls: boolean;
}): ProfileSample[];
/**
 * For a list of samples in a thread in a process, merges together stack frames
 * which have been sampled consecutively and which do not cross boundaries. The
 * samples and boundaries arrays are assumed to be sorted.
 *
 * Therefore, if the previously collected stack traces tree looks like this:
 *
 *   A   E
 *  / \
 * B   D
 * |
 * C
 *
 * ...we expect to reformulate something like:
 *
 * [A, B, C, C .. C, B, A, A .. A, D, D .. D, A, A .. A, E, E .. E]
 *
 * ...where each sample points to the tompost stack frame at that particular
 * point in time (e.g. the first sample's tompost stack frame is A, the last
 * sample's topmost stack frame is E, etc.), and thus the expanded samples array
 * can be represented as:
 *
 * +------------> (sample at time)
 * |
 * |A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A| |E|E|E|E|E|E|
 * | |B|B|B|B|B|B| |D|D|D|D|D|D| | | | | | | | | | |
 * | | |C|C|C|C| | | | | | | | | | | | | | | | | | |
 * |
 * V (stack trace depth)
 *
 * ...into something ordered like below:
 *
 * [ Call A ][ Call E ]
 *
 * ...where the hierarchy of these calls can be represented as:
 *
 * [-------- Call A --------][ Call E ]
 *  [- Call B -][- Call D -]
 *   [ Call C ]
 *
 * ...and where each call has an absolute timestamp and a duration.
 *
 * Considerations:
 *
 * 1. Consecutive stack frames which cross boundaries may not be coalesced.
 * "Boundaries" are an array of timestamps corresponding to the begin and end
 * of certain events (such as "RunTask").
 *
 * For example, we expect to reformulate something like:
 *
 *   (boundary)                                    (boundary)
 *       |                                             |
 * |A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A|A| |E|E|E|E|E|E|   |
 *       |                                             |
 *
 * ...into something ordered like below:
 *
 * [ Call A ][ Call A ][ Call E ]
 *
 * ... where the first Call A is before the first boundary, second Call A is
 * after the first boundary, and Call E is inbetween boundaries.
 *
 * 2. Consecutive stack frames which are part of different branches (a.k.a part
 * of a different stack trace) must not be coalesced, even if at the same depth.
 *
 * For example, with something like:
 *
 * +------------> (sample at time)
 * |
 * | ... |X|X|X|Z|Z|Z| ...
 * |         |Y|Y|
 * |
 * V (stack trace depth)
 *
 * ...or:
 *
 * +------------> (sample at time)
 * |
 * | ... |X|X|X|Z|X|X|X| ...
 * |         |Y| |Y|
 * |
 * V (stack trace depth)
 *
 * ...the Y stack frames must not be merged even if they have been sampled
 * close together, and even if they do not cross any boundaries (e.g. are part
 * of the same `RunTask`). This is because they are either:
 * - part of separate stack traces (and therefore would have different IDs), or
 * - separated by a different parent frame.
 */
export declare function mergeCalls(calls: ProfileCall[], boundaries: Types.Timing.MicroSeconds[]): {
    calls: ProfileCall[];
    dur: Types.Timing.MicroSeconds;
};
/**
 * Checks if the call frame is allowed (i.e. it may not be part of the collected
 * stack traces tree).
 */
export declare function isAllowedCallFrame(callFrame: Types.TraceEvents.TraceEventCallFrame, options?: {
    filterCodeTypes: boolean;
    filterUrls: boolean;
}): boolean;
/**
 * Walks the stack traces tree from top to bottom until it finds a call frame that is allowed.
 */
export declare function findTopmostAllowedCallFrame(nodeId: Types.TraceEvents.CallFrameID | null, tree: ProfileTree, options?: {
    filterCodeTypes: boolean;
    filterUrls: boolean;
}): Types.TraceEvents.CallFrameID | null;
/**
 * Gets the stack trace associated with a sample. The topmost stack frame will
 * be the last entry of array. Aka the root stack frame will be the first.
 *
 * All the complete stack traces are stored as part of a profile tree. All the
 * samples point to the topmost stack frame. This method walks up the tree to
 * compose a stack trace.
 */
export declare function buildStackTraceAsCallFrameIdsFromId(tree: ProfileTree, nodeId: Types.TraceEvents.CallFrameID): Types.TraceEvents.CallFrameID[];
/**
 * Just like `buildStackTrace`, but returns an array of call frames instead of ids.
 */
export declare function buildStackTraceAsCallFramesFromId(tree: ProfileTree, nodeId: Types.TraceEvents.CallFrameID): Types.TraceEvents.TraceEventCallFrame[];
/**
 * Just like `buildStackTrace`, but returns a `ProfileCall` instead of an array.
 */
export declare function buildProfileCallFromSample(tree: ProfileTree, sample: ProfileSample): ProfileCall;
/**
 * Gets all functions that have been called between the given timestamps, each
 * with additional information:
 * - the call frame id, which points to a node containing the function name etc.
 * - all individual calls for that function
 * - percentage of time taken, relative to the given timestamps
 * - percentage of self time taken relative to the given timestamps
 */
export declare function getAllFunctionsBetweenTimestamps(calls: ProfileCall[], begin: Types.Timing.MicroSeconds, end: Types.Timing.MicroSeconds, out?: Map<Types.TraceEvents.CallFrameID, ProfileFunction>): IterableIterator<ProfileFunction>;
/**
 * Gets all the hot functions between timestamps, each with information about
 * the relevant call frame, time, self time, and percentages.
 *
 * The hot functions are sorted by self time.
 */
export declare function getAllHotFunctionsBetweenTimestamps(calls: ProfileCall[], begin: Types.Timing.MicroSeconds, end: Types.Timing.MicroSeconds, minSelfPercent: number): ProfileFunction[];
export interface SamplesHandlerData {
    profiles: Map<Types.TraceEvents.ProfileID, Partial<SamplesProfile>>;
    processes: Map<Types.TraceEvents.ProcessID, SamplesProcess>;
}
export interface SamplesProfile {
    head: Types.TraceEvents.TraceEventProfile;
    chunks: Types.TraceEvents.TraceEventProfileChunk[];
}
export interface SamplesProcess {
    threads: Map<Types.TraceEvents.ThreadID, SamplesThread>;
}
export interface SamplesThread {
    profile: SamplesProfile;
    boundaries?: Types.Timing.MicroSeconds[];
    tree?: ProfileTree;
    samples?: ProfileSample[];
    calls?: ProfileCall[];
    dur?: Types.Timing.MicroSeconds;
}
export interface ProfileTree {
    nodes: Map<Types.TraceEvents.CallFrameID, ProfileNode>;
}
export interface ProfileNode {
    callFrame: Types.TraceEvents.TraceEventCallFrame;
    parentId: Types.TraceEvents.CallFrameID | null;
    childrenIds: Set<Types.TraceEvents.CallFrameID>;
}
export interface ProfileSample {
    topmostStackFrame: {
        nodeId: Types.TraceEvents.CallFrameID;
    };
    pid: Types.TraceEvents.ProcessID;
    tid: Types.TraceEvents.ThreadID;
    ts: Types.Timing.MicroSeconds;
}
export interface ProfileCall {
    stackFrame: {
        nodeId: Types.TraceEvents.CallFrameID;
    };
    pid: Types.TraceEvents.ProcessID;
    tid: Types.TraceEvents.ThreadID;
    ts: Types.Timing.MicroSeconds;
    dur: Types.Timing.MicroSeconds;
    selfDur: Types.Timing.MicroSeconds;
    children: ProfileCall[];
}
export interface ProfileFunction {
    stackFrame: {
        nodeId: Types.TraceEvents.CallFrameID;
    };
    calls: ProfileCall[];
    durPercent: number;
    selfDurPercent: number;
}
