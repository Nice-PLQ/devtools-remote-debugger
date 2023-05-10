import * as Common from '../../core/common/common.js';
import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as UI from '../../ui/legacy/legacy.js';
import { IssueView } from './IssueView.js';
export declare function getGroupIssuesByCategorySetting(): Common.Settings.Setting<boolean>;
export declare class IssuesPane extends UI.Widget.VBox {
    private categoryViews;
    private issueViews;
    private kindViews;
    private showThirdPartyCheckbox;
    private issuesTree;
    private hiddenIssuesRow;
    private noIssuesMessageDiv;
    private issuesManager;
    private aggregator;
    private issueViewUpdatePromise;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): IssuesPane;
    elementsToRestoreScrollPositionsFor(): Element[];
    private createToolbars;
    private issueUpdated;
    private scheduleIssueViewUpdate;
    /** Don't call directly. Use `scheduleIssueViewUpdate` instead. */
    private updateIssueView;
    appendIssueViewToParent(issueView: IssueView, parent: UI.TreeOutline.TreeOutline | UI.TreeOutline.TreeElement): void;
    private getIssueViewParent;
    private clearViews;
    private onFullUpdate;
    private fullUpdate;
    private updateIssueKindViewsCount;
    private updateCounts;
    private showIssuesTreeOrNoIssuesDetectedMessage;
    reveal(issue: IssuesManager.Issue.Issue): Promise<void>;
    wasShown(): void;
}
