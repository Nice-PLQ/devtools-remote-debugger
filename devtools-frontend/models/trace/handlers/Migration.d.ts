import * as GPU from './GPUHandler.js';
import * as LayoutShifts from './LayoutShiftsHandler.js';
import * as NetworkRequests from './NetworkRequestsHandler.js';
import * as PageLoadMetrics from './PageLoadMetricsHandler.js';
import * as Screenshots from './ScreenshotsHandler.js';
import * as UserInteractions from './UserInteractionsHandler.js';
import * as UserTimings from './UserTimingsHandler.js';
import type * as Types from './types.js';
export declare const ENABLED_TRACE_HANDLERS: {
    UserTimings: typeof UserTimings;
    PageLoadMetrics: typeof PageLoadMetrics;
    UserInteractions: typeof UserInteractions;
    LayoutShifts: typeof LayoutShifts;
    Screenshots: typeof Screenshots;
    GPU: typeof GPU;
    NetworkRequests: typeof NetworkRequests;
};
export type PartialTraceData = Readonly<Types.EnabledHandlerDataWithMeta<typeof ENABLED_TRACE_HANDLERS>>;
