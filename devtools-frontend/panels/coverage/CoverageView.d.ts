import * as Common from '../../core/common/common.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import type * as Workspace from '../../models/workspace/workspace.js';
export declare class CoverageView extends UI.Widget.VBox {
    private model;
    private decorationManager;
    private resourceTreeModel;
    private readonly coverageTypeComboBox;
    private readonly coverageTypeComboBoxSetting;
    private toggleRecordAction;
    private readonly toggleRecordButton;
    private inlineReloadButton;
    private readonly startWithReloadButton;
    private readonly clearButton;
    private readonly saveButton;
    private textFilterRegExp;
    private readonly filterInput;
    private typeFilterValue;
    private readonly filterByTypeComboBox;
    private showContentScriptsSetting;
    private readonly contentScriptsCheckbox;
    private readonly coverageResultsElement;
    private readonly landingPage;
    private listView;
    private readonly statusToolbarElement;
    private statusMessageElement;
    private constructor();
    static instance(): CoverageView;
    private buildLandingPage;
    private clear;
    private reset;
    toggleRecording(): void;
    isBlockCoverageSelected(): boolean;
    private selectCoverageType;
    private onCoverageTypeComboBoxSelectionChanged;
    ensureRecordingStarted(): Promise<void>;
    startRecording(options: {
        reload: (boolean | undefined);
        jsCoveragePerBlock: (boolean | undefined);
    } | null): Promise<void>;
    private onCoverageDataReceived;
    stopRecording(): Promise<void>;
    processBacklog(): void;
    private onMainFrameNavigated;
    private updateViews;
    private updateStats;
    private onFilterChanged;
    private onFilterByTypeChanged;
    private isVisible;
    private exportReport;
    selectCoverageItemByUrl(url: string): void;
    static readonly EXTENSION_BINDINGS_URL_PREFIX = "extensions::";
    wasShown(): void;
}
export declare class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
    handleAction(context: UI.Context.Context, actionId: string): boolean;
    static instance(opts?: {
        forceNew: boolean | null;
    }): ActionDelegate;
    private innerHandleAction;
}
export declare class LineDecorator implements SourceFrame.SourceFrame.LineDecorator {
    static instance({ forceNew }?: {
        forceNew: boolean;
    }): LineDecorator;
    private readonly listeners;
    constructor();
    decorate(uiSourceCode: Workspace.UISourceCode.UISourceCode, textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor): void;
    private innerDecorate;
    makeGutterClickHandler(url: string): (arg0: Common.EventTarget.EventTargetEvent<SourceFrame.SourcesTextEditor.GutterClickEventData>) => void;
    private installGutter;
    private uninstallGutter;
    static readonly GUTTER_TYPE = "CodeMirror-gutter-coverage";
}
