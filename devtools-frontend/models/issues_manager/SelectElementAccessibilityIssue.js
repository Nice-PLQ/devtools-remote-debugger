// Copyright 2025 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { Issue } from './Issue.js';
import { resolveLazyDescription } from './MarkdownIssueDescription.js';
export class SelectElementAccessibilityIssue extends Issue {
    issueDetails;
    constructor(issueDetails, issuesModel, issueId) {
        const issueCode = [
            "SelectElementAccessibilityIssue" /* Protocol.Audits.InspectorIssueCode.SelectElementAccessibilityIssue */,
            issueDetails.selectElementAccessibilityIssueReason,
        ].join('::');
        super(issueCode, issuesModel, issueId);
        this.issueDetails = issueDetails;
    }
    primaryKey() {
        return JSON.stringify(this.issueDetails);
    }
    getDescription() {
        if (this.issueDetails.hasDisallowedAttributes &&
            (this.issueDetails.selectElementAccessibilityIssueReason !==
                "InteractiveContentOptionChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.InteractiveContentOptionChild */)) {
            return {
                file: 'selectElementAccessibilityInteractiveContentAttributesSelectDescendant.md',
                links: [],
            };
        }
        const description = issueDescriptions.get(this.issueDetails.selectElementAccessibilityIssueReason);
        if (!description) {
            return null;
        }
        return resolveLazyDescription(description);
    }
    getKind() {
        return "PageError" /* IssueKind.PAGE_ERROR */;
    }
    getCategory() {
        return "Other" /* IssueCategory.OTHER */;
    }
    details() {
        return this.issueDetails;
    }
    static fromInspectorIssue(issuesModel, inspectorIssue) {
        const selectElementAccessibilityIssueDetails = inspectorIssue.details.selectElementAccessibilityIssueDetails;
        if (!selectElementAccessibilityIssueDetails) {
            console.warn('Select Element Accessibility issue without details received.');
            return [];
        }
        return [new SelectElementAccessibilityIssue(selectElementAccessibilityIssueDetails, issuesModel, inspectorIssue.issueId)];
    }
}
const issueDescriptions = new Map([
    [
        "DisallowedSelectChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.DisallowedSelectChild */,
        {
            file: 'selectElementAccessibilityDisallowedSelectChild.md',
            links: [],
        },
    ],
    [
        "DisallowedOptGroupChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.DisallowedOptGroupChild */,
        {
            file: 'selectElementAccessibilityDisallowedOptGroupChild.md',
            links: [],
        },
    ],
    [
        "NonPhrasingContentOptionChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.NonPhrasingContentOptionChild */,
        {
            file: 'selectElementAccessibilityNonPhrasingContentOptionChild.md',
            links: [],
        },
    ],
    [
        "InteractiveContentOptionChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.InteractiveContentOptionChild */,
        {
            file: 'selectElementAccessibilityInteractiveContentOptionChild.md',
            links: [],
        },
    ],
    [
        "InteractiveContentLegendChild" /* Protocol.Audits.SelectElementAccessibilityIssueReason.InteractiveContentLegendChild */,
        {
            file: 'selectElementAccessibilityInteractiveContentLegendChild.md',
            links: [],
        },
    ],
]);
//# sourceMappingURL=SelectElementAccessibilityIssue.js.map