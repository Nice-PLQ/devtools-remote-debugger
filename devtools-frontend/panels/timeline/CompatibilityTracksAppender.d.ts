import * as TraceEngine from '../../models/trace/trace.js';
import type * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import { type TimelineFlameChartEntry, EntryType } from './TimelineFlameChartDataProvider.js';
import { TimingsTrackAppender } from './TimingsTrackAppender.js';
import { InteractionsTrackAppender } from './InteractionsTrackAppender.js';
import { GPUTrackAppender } from './GPUTrackAppender.js';
import { LayoutShiftsTrackAppender } from './LayoutShiftsTrackAppender.js';
export type HighlightedEntryInfo = {
    title: string;
    formattedTime: string;
    warning?: string;
};
/**
 * Track appenders add the data of each track into the timeline flame
 * chart. Each track appender also implements functions tha allow the
 * canvas renderer to gather more information about an event in a track,
 * like its display name or color.
 *
 * At the moment, tracks in the timeline flame chart are appended in
 * two locations: in the TimelineFlameChartDataProvider and in the track
 * appenders exported by this module. As part of the work to use a new
 * trace parsing engine, a track appender will be defined with this API
 * for each of the tracks in the timeline. With this implementation in
 * place its counterpart in the TimelineFlameChartDataProvider can be
 * removed. This processes of doing this for a track is referred to as
 * "migrating the track" to the new system.
 *
 * The migration implementation will result beneficial among other
 * things because the complexity of rendering the details of each track
 * is distributed among multiple standalone modules.
 * Read more at go/rpp-flamechart-arch
 */
export interface TrackAppender {
    /**
     * The unique name given to the track appender.
     */
    appenderName: TrackAppenderName;
    /**
     * Appends into the flame chart data the data corresponding to a track.
     * @param level the horizontal level of the flame chart events where the
     * track's events will start being appended.
     * @param expanded wether the track should be rendered expanded.
     * @returns the first available level to append more data after having
     * appended the track's events.
     */
    appendTrackAtLevel(level: number, expanded?: boolean): number;
    /**
     * Returns the color an event is shown with in the timeline.
     */
    colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
    /**
     * Returns the title an event is shown with in the timeline.
     */
    titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): string;
    /**
     * Returns the info shown when an event in the timeline is hovered.
     */
    highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData): HighlightedEntryInfo;
}
export declare const TrackNames: readonly ["Timings", "Interactions", "GPU", "LayoutShifts"];
export type TrackAppenderName = typeof TrackNames[number];
export declare class CompatibilityTracksAppender {
    #private;
    /**
     * @param flameChartData the data used by the flame chart renderer on
     * which the track data will be appended.
     * @param traceParsedData the trace parsing engines output.
     * @param entryData the array containing all event to be rendered in
     * the flamechart.
     * @param legacyEntryTypeByLevel an array containing the type of
     * each entry in the entryData array. Indexed by the position the
     * corresponding entry occupies in the entryData array. This reference
     * is needed only for compatibility with the legacy flamechart
     * architecture and should be removed once all tracks use the new
     * system.
     */
    constructor(flameChartData: PerfUI.FlameChart.FlameChartTimelineData, traceParsedData: TraceEngine.Handlers.Migration.PartialTraceData, entryData: TimelineFlameChartEntry[], legacyEntryTypeByLevel: EntryType[], legacyTimelineModel: TimelineModel.TimelineModel.TimelineModelImpl);
    /**
     * Given a trace event returns instantiates a legacy SDK.Event. This should
     * be used for compatibility purposes only.
     */
    getLegacyEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): SDK.TracingModel.Event | null;
    timingsTrackAppender(): TimingsTrackAppender;
    interactionsTrackAppender(): InteractionsTrackAppender;
    gpuTrackAppender(): GPUTrackAppender;
    layoutShiftsTrackAppender(): LayoutShiftsTrackAppender;
    /**
     * Get the index of the event.
     * This ${index}-th elements in entryData, flameChartData.entryLevels, flameChartData.entryTotalTimes,
     * flameChartData.entryStartTimes are all related to this event.
     */
    indexForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData): number | undefined;
    eventsInTrack(trackAppenderName: TrackAppenderName): TraceEngine.Types.TraceEvents.TraceEventData[];
    /**
     * Determines if the given events, which are assumed to be ordered can
     * be organized into tree structures.
     * This condition is met if there is *not* a pair of async events
     * e1 and e2 where:
     *
     * e1.startTime <= e2.startTime && e1.endTime > e2.startTime && e1.endTime > e2.endTime.
     * or, graphically:
     * |------- e1 ------|
     *   |------- e2 --------|
     *
     * Because a parent-child relationship cannot be made from the example
     * above, a tree cannot be made from the set of events.
     *
     * Note that this will also return true if multiple trees can be
     * built, for example if none of the events overlap with each other.
     */
    canBuildTreesFromEvents(events: readonly TraceEngine.Types.TraceEvents.TraceEventData[]): boolean;
    /**
     * Gets the events to be shown in the tree views of the details pane
     * (Bottom-up, Call tree, etc.). These are the events from the track
     * that can be arranged in a tree shape.
     */
    eventsForTreeView(trackAppenderName: TrackAppenderName): TraceEngine.Types.TraceEvents.TraceEventData[];
    /**
     * Caches the track appender that owns a flame chart group. FlameChart
     * groups are created for each track in the timeline. When an user
     * selects a track in the UI, the track's group is passed to the model
     * layer to inform about the selection.
     */
    registerTrackForGroup(group: PerfUI.FlameChart.Group, appender: TrackAppender): void;
    /**
     * Given a FlameChart group, gets the events to be shown in the tree
     * views if that group was registered by the appender system.
     */
    groupEventsForTreeView(group: PerfUI.FlameChart.Group): TraceEngine.Types.TraceEvents.TraceEventData[] | null;
    /**
     * Caches the track appender that owns a level. An appender takes
     * ownership of a level when it appends data to it.
     * The cache is useful to determine what appender should handle a
     * query from the flame chart renderer when an event's feature (like
     * style, title, etc.) is needed.
     */
    registerTrackForLevel(level: number, appender: TrackAppender): void;
    /**
     * Adds an event to the flame chart data at a defined level.
     * @param event the event to be appended,
     * @param level the level to append the event,
     * @param appender the track which the event belongs to.
     * @returns the index of the event in all events to be rendered in the flamechart.
     */
    appendEventAtLevel(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number, appender: TrackAppender): number;
    /**
     * Adds into the flame chart data a list of trace events.
     * @param events the trace events that will be appended to the flame chart.
     * The events should be taken straight from the trace handlers. The handlers
     * should sort the events by start time, and the parent event is before the
     * child.
     * @param trackStartLevel the flame chart level from which the events will
     * be appended.
     * @param appender the track that the trace events belong to.
     * @returns the next level after the last occupied by the appended these
     * trace events (the first available level to append next track).
     */
    appendEventsAtLevel(events: readonly TraceEngine.Types.TraceEvents.TraceEventData[], trackStartLevel: number, appender: TrackAppender): number;
    /**
     * Gets the all track appenders that have been set to be visible.
     */
    allVisibleTrackAppenders(): TrackAppender[];
    /**
     * Sets the visible tracks internally
     * @param visibleTracks set with the names of the visible track
     * appenders. If undefined, all tracks are set to be visible.
     */
    setVisibleTracks(visibleTracks?: Set<TrackAppenderName>): void;
    /**
     * Returns the color an event is shown with in the timeline.
     */
    colorForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string;
    /**
     * Returns the title an event is shown with in the timeline.
     */
    titleForEvent(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): string;
    /**
     * Returns the info shown when an event in the timeline is hovered.
     */
    highlightedEntryInfo(event: TraceEngine.Types.TraceEvents.TraceEventData, level: number): HighlightedEntryInfo;
}
