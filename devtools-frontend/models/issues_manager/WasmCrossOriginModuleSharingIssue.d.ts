import * as Protocol from '../../generated/protocol.js';
import type * as SDK from '../../core/sdk/sdk.js';
import { Issue, IssueCategory, IssueKind } from './Issue.js';
import type { MarkdownIssueDescription } from './MarkdownIssueDescription.js';
export declare class WasmCrossOriginModuleSharingIssue extends Issue<Protocol.Audits.InspectorIssueCode.WasmCrossOriginModuleSharingIssue> {
    private issueDetails;
    constructor(issueDetails: Protocol.Audits.WasmCrossOriginModuleSharingIssueDetails, issuesModel: SDK.IssuesModel.IssuesModel);
    getCategory(): IssueCategory;
    details(): Protocol.Audits.WasmCrossOriginModuleSharingIssueDetails;
    getDescription(): MarkdownIssueDescription | null;
    primaryKey(): string;
    getKind(): IssueKind;
    static fromInspectorIssue(issuesModel: SDK.IssuesModel.IssuesModel, inspectorIssue: Protocol.Audits.InspectorIssue): WasmCrossOriginModuleSharingIssue[];
}
