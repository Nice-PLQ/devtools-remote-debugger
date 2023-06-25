/**
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../../../../core/common/common.js';
import * as Platform from '../../../../core/platform/platform.js';
import type * as SDK from '../../../../core/sdk/sdk.js';
import type * as TimelineModel from '../../../../models/timeline_model/timeline_model.js';
import * as TraceEngine from '../../../../models/trace/trace.js';
import * as UI from '../../legacy.js';
import { type ChartViewportDelegate } from './ChartViewport.js';
import { type Calculator } from './TimelineGrid.js';
export declare class FlameChartDelegate {
    windowChanged(_startTime: number, _endTime: number, _animate: boolean): void;
    updateRangeSelection(_startTime: number, _endTime: number): void;
    updateSelectedGroup(_flameChart: FlameChart, _group: Group | null): void;
}
interface GroupExpansionState {
    [key: string]: boolean;
}
declare const FlameChart_base: (new (...args: any[]) => {
    "__#13@#events": Common.ObjectWrapper.ObjectWrapper<EventTypes>;
    addEventListener<T extends keyof EventTypes>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T], any>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<EventTypes, T>;
    once<T_1 extends keyof EventTypes>(eventType: T_1): Promise<EventTypes[T_1]>;
    removeEventListener<T_2 extends keyof EventTypes>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T_2], any>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: keyof EventTypes): boolean;
    dispatchEventToListeners<T_3 extends keyof EventTypes>(eventType: Platform.TypeScriptUtilities.NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<EventTypes, T_3>): void;
}) & typeof UI.Widget.VBox;
export declare class FlameChart extends FlameChart_base implements Calculator, ChartViewportDelegate {
    #private;
    private readonly groupExpansionSetting?;
    private groupExpansionState;
    private readonly flameChartDelegate;
    private chartViewport;
    private dataProvider;
    private candyStripeCanvas;
    private viewportElement;
    private canvas;
    private entryInfo;
    private readonly markerHighlighElement;
    readonly highlightElement: HTMLElement;
    private readonly selectedElement;
    private rulerEnabled;
    private barHeight;
    private textBaseline;
    private textPadding;
    private readonly headerLeftPadding;
    private arrowSide;
    private readonly expansionArrowIndent;
    private readonly headerLabelXPadding;
    private readonly headerLabelYPadding;
    private highlightedMarkerIndex;
    private highlightedEntryIndex;
    private selectedEntryIndex;
    private rawTimelineDataLength;
    private readonly markerPositions;
    private lastMouseOffsetX;
    private selectedGroup;
    private keyboardFocusedGroup;
    private offsetWidth;
    private offsetHeight;
    private dragStartX;
    private dragStartY;
    private lastMouseOffsetY;
    private minimumBoundaryInternal;
    private maxDragOffset;
    private timelineLevels?;
    private visibleLevelOffsets?;
    private visibleLevels?;
    private groupOffsets?;
    private rawTimelineData?;
    private forceDecorationCache?;
    private entryColorsCache?;
    private visibleLevelHeights?;
    private totalTime?;
    constructor(dataProvider: FlameChartDataProvider, flameChartDelegate: FlameChartDelegate, groupExpansionSetting?: Common.Settings.Setting<GroupExpansionState>);
    willHide(): void;
    setBarHeight(value: number): void;
    setTextBaseline(value: number): void;
    setTextPadding(value: number): void;
    enableRuler(enable: boolean): void;
    alwaysShowVerticalScroll(): void;
    disableRangeSelection(): void;
    highlightEntry(entryIndex: number): void;
    hideHighlight(): void;
    private createCandyStripePattern;
    private resetCanvas;
    windowChanged(startTime: number, endTime: number, animate: boolean): void;
    updateRangeSelection(startTime: number, endTime: number): void;
    setSize(width: number, height: number): void;
    private startDragging;
    private dragging;
    private endDragging;
    private timelineData;
    private revealEntry;
    setWindowTimes(startTime: number, endTime: number, animate?: boolean): void;
    private onMouseMove;
    private updateHighlight;
    private onMouseOut;
    private updatePopover;
    private updatePopoverOffset;
    private onClick;
    private selectGroup;
    private deselectAllGroups;
    private deselectAllEntries;
    private isGroupFocused;
    private scrollGroupIntoView;
    private toggleGroupExpand;
    private expandGroup;
    private onKeyDown;
    bindCanvasEvent(eventName: string, onEvent: (arg0: Event) => void): void;
    private handleKeyboardGroupNavigation;
    private selectFirstEntryInCurrentGroup;
    private selectPreviousGroup;
    private selectNextGroup;
    private getGroupIndexToSelect;
    private selectFirstChild;
    private handleSelectionNavigation;
    private coordinatesToEntryIndex;
    private coordinatesToGroupIndex;
    private markerIndexBeforeTime;
    private draw;
    /**
     * Preprocess the data to be drawn to speed the rendering time.
     * Especifically:
     *  - Groups events into color buckets.
     *  - Discards non visible events.
     *  - Gathers marker events (LCP, FCP, DCL, etc.).
     *  - Gathers event titles that should be rendered.
     */
    private getDrawableData;
    private drawGroupHeaders;
    /**
     * Draws page load events in the Timings track (LCP, FCP, DCL, etc.)
     */
    private drawMarkers;
    /**
     * Draws the titles of trace events in the timeline. Also calls `decorateEntry` on the data
     * provider, which can do any custom drawing on the corresponding entry's area (e.g. draw screenshots
     * in the Performance Panel timeline).
     *
     * Takes in the width of the entire canvas so that we know if an event does
     * not fit into the viewport entirely, the max width we can draw is that
     * width, not the width of the event itself.
     */
    private drawEventTitles;
    private forEachGroup;
    private forEachGroupInViewport;
    private labelWidthForGroup;
    private drawCollapsedOverviewForGroup;
    private drawFlowEvents;
    /**
     * Draws the vertical dashed lines in the timeline marking where the "Marker" events
     * happened in time.
     */
    private drawMarkerLines;
    private updateMarkerHighlight;
    private processTimelineData;
    private updateLevelPositions;
    private isGroupCollapsible;
    setSelectedEntry(entryIndex: number): void;
    private updateElementPosition;
    private timeToPositionClipped;
    /**
     * Returns the amount of pixels a level is vertically offset in the.
     * flame chart.
     */
    levelToOffset(level: number): number;
    private levelHeight;
    private updateBoundaries;
    private updateHeight;
    onResize(): void;
    update(): void;
    reset(): void;
    scheduleUpdate(): void;
    private enabled;
    computePosition(time: number): number;
    formatValue(value: number, precision?: number): string;
    maximumBoundary(): number;
    minimumBoundary(): number;
    zeroTime(): number;
    boundarySpan(): number;
}
export declare const HeaderHeight = 15;
export declare const MinimalTimeWindowMs = 0.5;
/**
 * Represents a decoration that can be added to event. Each event can have as
 * many decorations as required.
 *
 * It is anticipated in the future that we will add to this as we want to
 * annotate events in more ways.
 *
 * This work is being tracked in crbug.com/1434297.
 **/
export type FlameChartDecoration = {
    type: 'CANDY';
    startAtTime: TraceEngine.Types.Timing.MicroSeconds;
} | {
    type: 'WARNING_TRIANGLE';
};
export declare function sortDecorationsForRenderingOrder(decorations: FlameChartDecoration[]): void;
export declare class FlameChartTimelineData {
    entryLevels: number[] | Uint16Array;
    entryTotalTimes: number[] | Float32Array;
    entryStartTimes: number[] | Float64Array;
    /**
     * An array of entry decorations, where each item in the array is an array of
     * decorations for the event at that index.
     **/
    readonly entryDecorations: FlameChartDecoration[][];
    groups: Group[];
    markers: FlameChartMarker[];
    flowStartTimes: number[];
    flowStartLevels: number[];
    flowEndTimes: number[];
    flowEndLevels: number[];
    selectedGroup: Group | null;
    private constructor();
    static create(data: {
        entryLevels: FlameChartTimelineData['entryLevels'];
        entryTotalTimes: FlameChartTimelineData['entryTotalTimes'];
        entryStartTimes: FlameChartTimelineData['entryStartTimes'];
        groups: FlameChartTimelineData['groups'] | null;
        entryDecorations?: FlameChartDecoration[][];
    }): FlameChartTimelineData;
    static createEmpty(): FlameChartTimelineData;
}
export interface FlameChartDataProvider {
    minimumBoundary(): number;
    totalTime(): number;
    formatValue(value: number, precision?: number): string;
    maxStackDepth(): number;
    timelineData(): FlameChartTimelineData | null;
    prepareHighlightedEntryInfo(entryIndex: number): Element | null;
    canJumpToEntry(entryIndex: number): boolean;
    entryTitle(entryIndex: number): string | null;
    entryFont(entryIndex: number): string | null;
    entryColor(entryIndex: number): string;
    decorateEntry(entryIndex: number, context: CanvasRenderingContext2D, text: string | null, barX: number, barY: number, barWidth: number, barHeight: number, unclippedBarX: number, timeToPixelRatio: number): boolean;
    forceDecoration(entryIndex: number): boolean;
    textColor(entryIndex: number): string;
    navStartTimes(): Map<string, SDK.TracingModel.Event>;
}
export interface FlameChartMarker {
    startTime(): number;
    color(): string;
    title(): string | null;
    draw(context: CanvasRenderingContext2D, x: number, height: number, pixelsPerMillisecond: number): void;
}
export declare enum Events {
    /**
     * Emitted when the <canvas> element of the FlameChart is focused by the user.
     **/
    CanvasFocused = "CanvasFocused",
    /**
     * Emitted when an event is selected by either mouse click, or hitting
     * <enter> on the keyboard - e.g. the same actions that would invoke a
     * <button> element.
     *
     * Will be emitted with a number which is the index of the entry that has
     * been selected, or -1 if no entry is selected (e.g the user has clicked
     * away from any events)
     */
    EntryInvoked = "EntryInvoked",
    /**
     * Emitted when an event is selected via keyboard navigation using the arrow
     * keys.
     *
     * Will be emitted with a number which is the index of the entry that has
     * been selected, or -1 if no entry is selected.
     */
    EntrySelected = "EntrySelected",
    /**
     * Emitted when an event is hovered over with the mouse.
     *
     * Will be emitted with a number which is the index of the entry that has
     * been hovered on, or -1 if no entry is selected (the user has moved their
     * mouse off the event)
     */
    EntryHighlighted = "EntryHighlighted"
}
export type EventTypes = {
    [Events.CanvasFocused]: number | void;
    [Events.EntryInvoked]: number;
    [Events.EntrySelected]: number;
    [Events.EntryHighlighted]: number;
};
export interface Group {
    name: Common.UIString.LocalizedString;
    startLevel: number;
    expanded?: boolean;
    selectable?: boolean;
    style: GroupStyle;
    track?: TimelineModel.TimelineModel.Track | null;
}
export interface GroupStyle {
    height: number;
    padding: number;
    collapsible: boolean;
    color: string;
    backgroundColor: string;
    nestingLevel: number;
    itemsHeight?: number;
    /** Allow entries to be placed on the same horizontal level as the text heading */
    shareHeaderLine?: boolean;
    useFirstLineForOverview?: boolean;
    useDecoratorsForOverview?: boolean;
}
export {};
