import * as SDK from '../../core/sdk/sdk.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import { type PerformanceModel } from './PerformanceModel.js';
export declare class TimelineEventOverview extends PerfUI.TimelineOverviewPane.TimelineOverviewBase {
    protected model: PerformanceModel | null;
    constructor(id: string, title: string | null);
    setModel(model: PerformanceModel | null): void;
    renderBar(begin: number, end: number, position: number, height: number, color: string): void;
}
export declare class TimelineEventOverviewNetwork extends TimelineEventOverview {
    constructor();
    update(): void;
}
export declare class TimelineEventOverviewCPUActivity extends TimelineEventOverview {
    private backgroundCanvas;
    constructor();
    resetCanvas(): void;
    update(): void;
}
export declare class TimelineEventOverviewResponsiveness extends TimelineEventOverview {
    constructor();
    update(): void;
}
export declare class TimelineFilmStripOverview extends TimelineEventOverview {
    #private;
    private frameToImagePromise;
    private lastFrame;
    private lastElement;
    private drawGeneration?;
    private emptyImage?;
    private imageWidth?;
    constructor(filmStripModel: SDK.FilmStripModel.FilmStripModel);
    update(): void;
    private imageByFrame;
    private drawFrames;
    overviewInfoPromise(x: number): Promise<Element | null>;
    reset(): void;
    static readonly Padding = 2;
}
export declare class TimelineEventOverviewMemory extends TimelineEventOverview {
    private heapSizeLabel;
    constructor();
    resetHeapSizeLabels(): void;
    update(): void;
}
export declare class Quantizer {
    private lastTime;
    private quantDuration;
    private readonly callback;
    private counters;
    private remainder;
    constructor(startTime: number, quantDuration: number, callback: (arg0: Array<number>) => void);
    appendInterval(time: number, group: number): void;
}
