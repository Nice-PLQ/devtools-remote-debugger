import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import type * as Protocol from '../../../generated/protocol.js';
import * as IssuesManager from '../../../models/issues_manager/issues_manager.js';
export interface IssueLinkIconData {
    issue?: IssuesManager.Issue.Issue | null;
    issueId?: Protocol.Audits.IssueId;
    issueResolver?: IssuesManager.IssueResolver.IssueResolver;
    additionalOnClickAction?: () => void;
    revealOverride?: (revealable: Object | null, omitFocus?: boolean | undefined) => Promise<void>;
}
export declare const extractShortPath: (path: string) => string;
export declare class IssueLinkIcon extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private issue?;
    private issueTitle;
    private issueTitlePromise;
    private issueId?;
    private issueResolver?;
    private additionalOnClickAction?;
    private reveal;
    private issueResolvedPromise;
    set data(data: IssueLinkIconData);
    private fetchIssueTitle;
    connectedCallback(): void;
    private resolveIssue;
    get data(): IssueLinkIconData;
    iconData(): IconButton.Icon.IconData;
    handleClick(event: MouseEvent): void;
    private getTooltip;
    private render;
    private renderComponent;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-issue-link-icon': IssueLinkIcon;
    }
}
