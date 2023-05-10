import * as UI from '../../ui/legacy/legacy.js';
export declare class BackForwardCacheView extends UI.ThrottledWidget.ThrottledWidget {
    constructor();
    wasShown(): void;
    private onBackForwardCacheUpdate;
    doUpdate(): Promise<void>;
    private getMainResourceTreeModel;
    private getMainFrame;
    private goBackOneHistoryEntry;
    private navigateAwayAndBack;
    private renderMainFrameInformation;
    private renderBackForwardCacheStatus;
    private maybeRenderExplanations;
    private renderExplanations;
    private renderReason;
}
