declare class MicroSecondsTag {
    #private;
}
export type MicroSeconds = number & MicroSecondsTag;
export declare function MicroSeconds(value: number): MicroSeconds;
declare class MilliSecondsTag {
    #private;
}
export type MilliSeconds = number & MilliSecondsTag;
export declare function MilliSeconds(value: number): MilliSeconds;
declare class SecondsTag {
    #private;
}
export type Seconds = number & SecondsTag;
export declare function Seconds(value: number): Seconds;
export declare const enum TimeUnit {
    MICROSECONDS = 0,
    MILLISECONDS = 1,
    SECONDS = 2,
    MINUTES = 3
}
export interface TraceWindow {
    min: MicroSeconds;
    max: MicroSeconds;
    range: MicroSeconds;
}
export {};
