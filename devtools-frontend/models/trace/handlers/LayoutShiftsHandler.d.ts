import { type TraceEventHandlerName } from './types.js';
import { ScoreClassification } from './PageLoadMetricsHandler.js';
import * as Types from '../types/types.js';
interface LayoutShifts {
    clusters: LayoutShiftCluster[];
    sessionMaxScore: number;
    clsWindowID: number;
    prePaintEvents: Types.TraceEvents.TraceEventPrePaint[];
    layoutInvalidationEvents: Types.TraceEvents.TraceEventLayoutInvalidation[];
    styleRecalcInvalidationEvents: Types.TraceEvents.TraceEventStyleRecalcInvalidation[];
    scoreRecords: ScoreRecord[];
}
export declare const MAX_CLUSTER_DURATION: Types.Timing.MicroSeconds;
export declare const MAX_SHIFT_TIME_DELTA: Types.Timing.MicroSeconds;
type ScoreRecord = {
    ts: number;
    score: number;
};
export declare function initialize(): void;
export declare function reset(): void;
export declare function handleEvent(event: Types.TraceEvents.TraceEventData): void;
export declare function findNextScreenshotEventIndex(screenshots: Types.TraceEvents.TraceEventSnapshot[], timestamp: Types.Timing.MicroSeconds): number | null;
export declare function finalize(): Promise<void>;
export declare function data(): LayoutShifts;
export declare function deps(): TraceEventHandlerName[];
export declare function stateForLayoutShiftScore(score: number): ScoreClassification;
export interface LayoutShiftCluster {
    clusterWindow: Types.Timing.TraceWindow;
    clusterCumulativeScore: number;
    events: Types.TraceEvents.SyntheticLayoutShift[];
    scoreWindows: {
        good: Types.Timing.TraceWindow;
        needsImprovement: Types.Timing.TraceWindow | null;
        bad: Types.Timing.TraceWindow | null;
    };
}
export declare const enum LayoutShiftsThreshold {
    GOOD = 0,
    NEEDS_IMPROVEMENT = 0.1,
    BAD = 0.25
}
export {};
