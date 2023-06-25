import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TimelineModel from '../../models/timeline_model/timeline_model.js';
import * as UI from '../../ui/legacy/legacy.js';
import { type Client } from './TimelineController.js';
import { TimelineSelection } from './TimelineSelection.js';
declare global {
    interface FileSystemWritableFileStream extends WritableStream {
        write(data: unknown): Promise<void>;
        close(): Promise<void>;
    }
    interface FileSystemHandle {
        createWritable(): Promise<FileSystemWritableFileStream>;
    }
    interface Window {
        showSaveFilePicker(opts: unknown): Promise<FileSystemHandle>;
    }
}
export declare class TimelinePanel extends UI.Panel.Panel implements Client, TimelineModeViewDelegate {
    #private;
    private readonly dropTarget;
    private readonly recordingOptionUIControls;
    private state;
    private recordingPageReload;
    private readonly millisecondsToRecordAfterLoadEvent;
    private readonly toggleRecordAction;
    private readonly recordReloadAction;
    private readonly historyManager;
    private performanceModel;
    private filmStripModel;
    private disableCaptureJSProfileSetting;
    private readonly captureLayersAndPicturesSetting;
    private showScreenshotsSetting;
    private showMemorySetting;
    private readonly panelToolbar;
    private readonly panelRightToolbar;
    private readonly timelinePane;
    private readonly overviewPane;
    private overviewControls;
    private readonly statusPaneContainer;
    private readonly flameChart;
    private readonly searchableViewInternal;
    private showSettingsPaneButton;
    private showSettingsPaneSetting;
    private settingsPane;
    private controller;
    private cpuProfiler;
    private clearButton;
    private loadButton;
    private saveButton;
    private statusPane;
    private landingPage;
    private loader?;
    private showScreenshotsToolbarCheckbox?;
    private showMemoryToolbarCheckbox?;
    private networkThrottlingSelect?;
    private cpuThrottlingSelect?;
    private fileSelectorElement?;
    private selection?;
    private primaryPageTargetPromiseCallback;
    private primaryPageTargetPromise;
    constructor();
    static instance(opts?: {
        forceNew: boolean | null;
        isNode: boolean;
    } | undefined): TimelinePanel;
    searchableView(): UI.SearchableView.SearchableView | null;
    wasShown(): void;
    willHide(): void;
    loadFromEvents(events: SDK.TracingManager.EventPayload[]): void;
    private loadFromCpuProfile;
    private onOverviewWindowChanged;
    private onModelWindowChanged;
    private setState;
    private createSettingCheckbox;
    private populateToolbar;
    private createSettingsPane;
    private createNetworkConditionsSelect;
    private prepareToLoadTimeline;
    private createFileSelector;
    private contextMenu;
    saveToFile(): Promise<void>;
    showHistory(): Promise<void>;
    navigateHistory(direction: number): boolean;
    selectFileToLoad(): void;
    loadFromFile(file: File): Promise<void>;
    loadFromURL(url: Platform.DevToolsPath.UrlString): Promise<void>;
    private updateOverviewControls;
    private onModeChanged;
    private updateSettingsPaneVisibility;
    private updateShowSettingsToolbarButton;
    private setUIControlsEnabled;
    private startRecording;
    private stopRecording;
    private recordingFailed;
    private onSuspendStateChanged;
    private consoleProfileFinished;
    private updateTimelineControls;
    toggleRecording(): Promise<void>;
    recordReload(): void;
    private onClearButton;
    private clear;
    private reset;
    private applyFilters;
    private setModel;
    private recordingStarted;
    recordingProgress(usage: number): void;
    private showLandingPage;
    private hideLandingPage;
    loadingStarted(): Promise<void>;
    loadingProgress(progress?: number): Promise<void>;
    processingStarted(): Promise<void>;
    updateModelAndFlameChart(): void;
    loadingComplete(tracingModel: SDK.TracingModel.TracingModel | null, exclusiveFilter?: TimelineModel.TimelineModelFilter.TimelineModelFilter | null): Promise<void>;
    loadingCompleteForTest(): void;
    private showRecordingStarted;
    private cancelLoading;
    private setMarkers;
    private loadEventFired;
    private frameForSelection;
    jumpToFrame(offset: number): true | undefined;
    select(selection: TimelineSelection | null): void;
    selectEntryAtTime(events: SDK.TracingModel.Event[] | null, time: number): void;
    highlightEvent(event: SDK.TracingModel.Event | null): void;
    private revealTimeRange;
    private handleDrop;
}
export declare enum State {
    Idle = "Idle",
    StartPending = "StartPending",
    Recording = "Recording",
    StopPending = "StopPending",
    Loading = "Loading",
    RecordingFailed = "RecordingFailed"
}
export declare const rowHeight = 18;
export declare const headerHeight = 20;
export interface TimelineModeViewDelegate {
    select(selection: TimelineSelection | null): void;
    selectEntryAtTime(events: SDK.TracingModel.CompatibleTraceEvent[] | null, time: number): void;
    highlightEvent(event: SDK.TracingModel.CompatibleTraceEvent | null): void;
}
export declare class StatusPane extends UI.Widget.VBox {
    private status;
    private time;
    private progressLabel;
    private progressBar;
    private readonly description;
    private button;
    private startTime;
    private timeUpdateTimer?;
    constructor(options: {
        showTimer?: boolean;
        showProgress?: boolean;
        description?: string;
        buttonText?: string;
        buttonDisabled?: boolean;
    }, buttonCallback: () => (Promise<void> | void));
    finish(): void;
    remove(): void;
    showPane(parent: Element): void;
    enableAndFocusButton(): void;
    updateStatus(text: string): void;
    updateProgressBar(activity: string, percent: number): void;
    startTimer(): void;
    private stopTimer;
    private updateTimer;
    private arrangeDialog;
    wasShown(): void;
}
export declare class LoadTimelineHandler implements Common.QueryParamHandler.QueryParamHandler {
    static instance(opts?: {
        forceNew: boolean | null;
    }): LoadTimelineHandler;
    handleQueryParam(value: string): void;
}
export declare class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    } | undefined): ActionDelegate;
    handleAction(_context: UI.Context.Context, actionId: string): boolean;
}
