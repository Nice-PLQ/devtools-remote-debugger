// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as UI from '../../ui/legacy/legacy.js';
import { getReleaseNote } from './ReleaseNoteText.js';
export const releaseVersionSeen = 'releaseNoteVersionSeen';
export const releaseNoteViewId = 'release-note';
let releaseNoteVersionSetting;
export function showReleaseNoteIfNeeded() {
    const releaseNoteVersionSetting = Common.Settings.Settings.instance().createSetting(releaseVersionSeen, 0);
    const releaseNoteVersionSettingValue = releaseNoteVersionSetting.get();
    const releaseNote = getReleaseNote();
    return innerShowReleaseNoteIfNeeded(releaseNoteVersionSettingValue, releaseNote.version, Common.Settings.Settings.instance().moduleSetting('help.show-release-note').get());
}
export function getReleaseNoteVersionSetting() {
    if (!releaseNoteVersionSetting) {
        releaseNoteVersionSetting = Common.Settings.Settings.instance().createSetting(releaseVersionSeen, 0);
    }
    return releaseNoteVersionSetting;
}
function innerShowReleaseNoteIfNeeded(lastSeenVersion, latestVersion, showReleaseNoteSettingEnabled) {
    const releaseNoteVersionSetting = Common.Settings.Settings.instance().createSetting(releaseVersionSeen, 0);
    if (!lastSeenVersion) {
        releaseNoteVersionSetting.set(latestVersion);
        return false;
    }
    if (!showReleaseNoteSettingEnabled) {
        return false;
    }
    if (lastSeenVersion >= latestVersion) {
        return false;
    }
    releaseNoteVersionSetting.set(latestVersion);
    void UI.ViewManager.ViewManager.instance().showView(releaseNoteViewId, true);
    return true;
}
let helpLateInitializationInstance;
export class HelpLateInitialization {
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!helpLateInitializationInstance || forceNew) {
            helpLateInitializationInstance = new HelpLateInitialization();
        }
        return helpLateInitializationInstance;
    }
    async run() {
        if (!Host.InspectorFrontendHost.isUnderTest()) {
            showReleaseNoteIfNeeded();
        }
    }
}
let releaseNotesActionDelegateInstance;
export class ReleaseNotesActionDelegate {
    handleAction(_context, _actionId) {
        const releaseNote = getReleaseNote();
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(releaseNote.link);
        return true;
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!releaseNotesActionDelegateInstance || forceNew) {
            releaseNotesActionDelegateInstance = new ReleaseNotesActionDelegate();
        }
        return releaseNotesActionDelegateInstance;
    }
}
let reportIssueActionDelegateInstance;
export class ReportIssueActionDelegate {
    handleAction(_context, _actionId) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab('https://goo.gle/devtools-bug');
        return true;
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!reportIssueActionDelegateInstance || forceNew) {
            reportIssueActionDelegateInstance = new ReportIssueActionDelegate();
        }
        return reportIssueActionDelegateInstance;
    }
}
//# sourceMappingURL=WhatsNewImpl.js.map