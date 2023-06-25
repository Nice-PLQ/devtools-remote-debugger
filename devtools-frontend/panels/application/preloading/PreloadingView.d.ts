import * as Common from '../../../core/common/common.js';
import * as UI from '../../../ui/legacy/legacy.js';
import * as Protocol from '../../../generated/protocol.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as PreloadingComponents from './components/components.js';
export declare class PreloadingRuleSetView extends UI.Widget.VBox {
    private model;
    private focusedRuleSetId;
    private focusedPreloadingAttemptId;
    private readonly warningsContainer;
    private readonly warningsView;
    private readonly hsplit;
    private readonly ruleSetGrid;
    private readonly ruleSetDetails;
    constructor(model: SDK.PreloadingModel.PreloadingModel);
    wasShown(): void;
    onScopeChange(): void;
    private updateRuleSetDetails;
    render(): void;
    private onRuleSetsGridCellFocused;
    getInfobarContainerForTest(): HTMLDivElement;
    getRuleSetGridForTest(): PreloadingComponents.RuleSetGrid.RuleSetGrid;
    getRuleSetDetailsForTest(): PreloadingComponents.RuleSetDetailsReportView.RuleSetDetailsReportView;
}
export declare class PreloadingAttemptView extends UI.Widget.VBox {
    private model;
    private focusedPreloadingAttemptId;
    private readonly warningsContainer;
    private readonly warningsView;
    private readonly preloadingGrid;
    private readonly preloadingDetails;
    private readonly ruleSetSelector;
    constructor(model: SDK.PreloadingModel.PreloadingModel);
    wasShown(): void;
    onScopeChange(): void;
    private updatePreloadingDetails;
    render(): void;
    private onPreloadingGridCellFocused;
    getRuleSetSelectorToolbarItemForTest(): UI.Toolbar.ToolbarItem;
    getPreloadingGridForTest(): PreloadingComponents.PreloadingGrid.PreloadingGrid;
    getPreloadingDetailsForTest(): PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView;
    selectRuleSetOnFilterForTest(id: Protocol.Preload.RuleSetId | null): void;
}
export declare class PreloadingResultView extends UI.Widget.VBox {
    private model;
    private readonly warningsContainer;
    private readonly warningsView;
    private readonly usedPreloading;
    constructor(model: SDK.PreloadingModel.PreloadingModel);
    wasShown(): void;
    onScopeChange(): void;
    render(): void;
    getUsedPreloadingForTest(): PreloadingComponents.UsedPreloadingView.UsedPreloadingView;
}
export declare class PreloadingWarningsView extends UI.Widget.VBox {
    constructor();
    onWarningsUpdated(event: Common.EventTarget.EventTargetEvent<SDK.PreloadingModel.PreloadWarnings>): void;
    private showInfobar;
}
