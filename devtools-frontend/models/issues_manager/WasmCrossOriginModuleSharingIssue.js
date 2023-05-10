// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import { Issue, IssueCategory, IssueKind } from './Issue.js';
const UIStrings = {
    /**
     * @description Label for the link in the description of Wasm cross-origin module sharing issues, that is, issues
     * that are related to the upcoming deprecation of cross-origin sharing of Wasm modules.
     */
    linkTitle: 'Restricting Wasm module sharing to same-origin',
};
const str_ = i18n.i18n.registerUIStrings('models/issues_manager/WasmCrossOriginModuleSharingIssue.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class WasmCrossOriginModuleSharingIssue extends Issue {
    issueDetails;
    constructor(issueDetails, issuesModel) {
        super("WasmCrossOriginModuleSharingIssue" /* WasmCrossOriginModuleSharingIssue */, issuesModel);
        this.issueDetails = issueDetails;
    }
    getCategory() {
        return IssueCategory.Other;
    }
    details() {
        return this.issueDetails;
    }
    getDescription() {
        return {
            file: 'wasmCrossOriginModuleSharing.md',
            links: [{
                    link: 'https://developer.chrome.com/blog/wasm-module-sharing-restricted-to-same-origin/',
                    linkTitle: i18nString(UIStrings.linkTitle),
                }],
        };
    }
    primaryKey() {
        return JSON.stringify(this.issueDetails);
    }
    getKind() {
        return this.issueDetails.isWarning ? IssueKind.BreakingChange : IssueKind.PageError;
    }
    static fromInspectorIssue(issuesModel, inspectorIssue) {
        const details = inspectorIssue.details.wasmCrossOriginModuleSharingIssue;
        if (!details) {
            console.warn('WasmCrossOriginModuleSharing issue without details received.');
            return [];
        }
        return [new WasmCrossOriginModuleSharingIssue(details, issuesModel)];
    }
}
//# sourceMappingURL=WasmCrossOriginModuleSharingIssue.js.map