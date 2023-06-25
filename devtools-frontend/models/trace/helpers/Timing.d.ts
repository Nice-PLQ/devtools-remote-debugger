import * as Types from '../types/types.js';
export declare const millisecondsToMicroseconds: (value: Types.Timing.MilliSeconds) => Types.Timing.MicroSeconds;
export declare const secondsToMilliseconds: (value: Types.Timing.Seconds) => Types.Timing.MilliSeconds;
export declare const secondsToMicroseconds: (value: Types.Timing.Seconds) => Types.Timing.MicroSeconds;
export declare const microSecondsToMilliseconds: (value: Types.Timing.MicroSeconds) => Types.Timing.MilliSeconds;
export declare function detectBestTimeUnit(timeInMicroseconds: Types.Timing.MicroSeconds): Types.Timing.TimeUnit;
interface FormatOptions extends Intl.NumberFormatOptions {
    format?: Types.Timing.TimeUnit;
}
export declare function formatMicrosecondsTime(timeInMicroseconds: Types.Timing.MicroSeconds, opts?: FormatOptions): string;
export declare function timeStampForEventAdjustedByClosestNavigation(event: Types.TraceEvents.TraceEventData, traceBounds: Types.Timing.TraceWindow, navigationsByNavigationId: Map<string, Types.TraceEvents.TraceEventNavigationStart>, navigationsByFrameId: Map<string, Types.TraceEvents.TraceEventNavigationStart[]>): Types.Timing.MicroSeconds;
export {};
