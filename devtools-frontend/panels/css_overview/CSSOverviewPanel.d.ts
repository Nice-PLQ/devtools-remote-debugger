import * as UI from '../../ui/legacy/legacy.js';
export declare class CSSOverviewPanel extends UI.Panel.Panel {
    #private;
    private constructor();
    static instance(): CSSOverviewPanel;
    private reset;
    private requestNodeHighlight;
    private renderInitialView;
    private renderOverviewStartedView;
    private renderOverviewCompletedView;
    private startOverview;
    private getStyleValue;
    private cancelOverview;
    private overviewCompleted;
    wasShown(): void;
}
