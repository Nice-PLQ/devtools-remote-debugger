import * as TraceEngine from '../../models/trace/trace.js';
import { TracingModel, type ObjectSnapshot } from './TracingModel.js';
export declare class FilmStripModel {
    #private;
    constructor(tracingModel: TracingModel, zeroTime?: number);
    hasFrames(): boolean;
    reset(tracingModel: TracingModel, zeroTime?: number): void;
    frames(): Frame[];
    zeroTime(): number;
    spanTime(): number;
    frameByTimestamp(searchTimestamp: number): Frame | null;
}
export declare class Frame {
    #private;
    timestamp: number;
    index: number;
    constructor(model: FilmStripModel, timestamp: number, index: number);
    static fromSnapshot(model: FilmStripModel, snapshot: ObjectSnapshot, index: number): Frame;
    static fromTraceEvent(model: FilmStripModel, snapshot: TraceEngine.Types.TraceEvents.TraceEventSnapshot, index: number): Frame;
    model(): FilmStripModel;
    imageDataPromise(): Promise<string | null>;
}
