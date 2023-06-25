import type * as Types from '../types/types.js';
import type * as Handlers from '../handlers/handlers.js';
export interface FilmStripData {
    frames: readonly FilmStripFrame[];
}
export interface FilmStripFrame {
    screenshotEvent: Types.TraceEvents.TraceEventSnapshot;
    screenshotAsString: string;
    index: number;
}
export declare function filmStripFromTraceEngine(traceData: Handlers.Migration.PartialTraceData, customZeroTime?: Types.Timing.MicroSeconds): FilmStripData;
export declare function frameClosestToTimestamp(filmStrip: FilmStripData, searchTimestamp: Types.Timing.MicroSeconds): FilmStripFrame | null;
