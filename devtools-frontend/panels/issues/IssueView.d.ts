import * as IssuesManager from '../../models/issues_manager/issues_manager.js';
import * as UI from '../../ui/legacy/legacy.js';
import type { AggregatedIssue } from './IssueAggregator.js';
export declare class IssueView extends UI.TreeOutline.TreeElement {
    private issue;
    private description;
    toggleOnClick: boolean;
    affectedResources: UI.TreeOutline.TreeElement;
    private readonly affectedResourceViews;
    private aggregatedIssuesCount;
    private issueKindIcon;
    private hasBeenExpandedBefore;
    private throttle;
    private needsUpdateOnExpand;
    private hiddenIssuesMenu;
    private contentCreated;
    constructor(issue: AggregatedIssue, description: IssuesManager.MarkdownIssueDescription.IssueDescription);
    /**
     * Sets the issue to take the resources from. Assumes that the description
     * this IssueView was initialized with fits the new issue as well, i.e.
     * title and issue description will not be updated.
     */
    setIssue(issue: AggregatedIssue): void;
    private static getBodyCSSClass;
    getIssueTitle(): string;
    onattach(): void;
    createContent(): void;
    appendAffectedResource(resource: UI.TreeOutline.TreeElement): void;
    private appendHeader;
    private showHiddenIssuesMenu;
    private hideHiddenIssuesMenu;
    onexpand(): void;
    private updateFromIssue;
    updateAffectedResourceVisibility(): void;
    private createAffectedResources;
    private createBody;
    private createReadMoreLinks;
    private doUpdate;
    update(): void;
    getIssueKind(): IssuesManager.Issue.IssueKind;
    isForHiddenIssue(): boolean;
    toggle(expand?: boolean): void;
}
