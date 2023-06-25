import * as UI from '../../ui/legacy/legacy.js';
export declare class CoverageView extends UI.Widget.VBox {
    private model;
    private decorationManager;
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
    private readonly bfcacheReloadPromptPage;
    private readonly activationReloadPromptPage;
    private listView;
    private readonly statusToolbarElement;
    private statusMessageElement;
    private constructor();
    static instance(): CoverageView;
    static removeInstance(): void;
    private buildLandingPage;
    private buildReloadPromptPage;
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
    private onPrimaryPageChanged;
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
