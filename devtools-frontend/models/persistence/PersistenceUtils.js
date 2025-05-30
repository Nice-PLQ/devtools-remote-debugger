// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as IconButton from '../../ui/components/icon_button/icon_button.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Workspace from '../workspace/workspace.js';
import { FileSystemWorkspaceBinding } from './FileSystemWorkspaceBinding.js';
import { NetworkPersistenceManager } from './NetworkPersistenceManager.js';
import { Events, PersistenceImpl } from './PersistenceImpl.js';
const UIStrings = {
    /**
     *@description Text in Persistence Utils of the Workspace settings in Settings
     *@example {example.url} PH1
     */
    linkedToSourceMapS: 'Linked to source map: {PH1}',
    /**
     *@description Text to show something is linked to another
     *@example {example.url} PH1
     */
    linkedToS: 'Linked to {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('models/persistence/PersistenceUtils.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class PersistenceUtils {
    static tooltipForUISourceCode(uiSourceCode) {
        const binding = PersistenceImpl.instance().binding(uiSourceCode);
        if (!binding) {
            return '';
        }
        if (uiSourceCode === binding.network) {
            return FileSystemWorkspaceBinding.tooltipForUISourceCode(binding.fileSystem);
        }
        if (binding.network.contentType().isFromSourceMap()) {
            return i18nString(UIStrings.linkedToSourceMapS, { PH1: Platform.StringUtilities.trimMiddle(binding.network.url(), 150) });
        }
        return i18nString(UIStrings.linkedToS, { PH1: Platform.StringUtilities.trimMiddle(binding.network.url(), 150) });
    }
    static iconForUISourceCode(uiSourceCode) {
        const binding = PersistenceImpl.instance().binding(uiSourceCode);
        if (binding) {
            if (!Common.ParsedURL.schemeIs(binding.fileSystem.url(), 'file:')) {
                return null;
            }
            const icon = new IconButton.Icon.Icon();
            icon.data = { iconName: 'document', color: 'var(--icon-default)', width: '14px', height: '14px' };
            UI.Tooltip.Tooltip.install(icon, PersistenceUtils.tooltipForUISourceCode(binding.network));
            if (NetworkPersistenceManager.instance().project() === binding.fileSystem.project()) {
                icon.classList.add('dot', 'purple');
            }
            else {
                icon.classList.add('dot', 'green');
            }
            return icon;
        }
        if (uiSourceCode.project().type() !== Workspace.Workspace.projectTypes.FileSystem ||
            !Common.ParsedURL.schemeIs(uiSourceCode.url(), 'file:')) {
            return null;
        }
        if (NetworkPersistenceManager.instance().isActiveHeaderOverrides(uiSourceCode)) {
            const icon = new IconButton.Icon.Icon();
            icon.data = { iconName: 'document', color: 'var(--icon-default)', width: '14px', height: '14px' };
            icon.classList.add('dot', 'purple');
            return icon;
        }
        const icon = new IconButton.Icon.Icon();
        icon.data = { iconName: 'document', color: 'var(--icon-default)', width: '14px', height: '14px' };
        UI.Tooltip.Tooltip.install(icon, PersistenceUtils.tooltipForUISourceCode(uiSourceCode));
        return icon;
    }
}
export class LinkDecorator extends Common.ObjectWrapper.ObjectWrapper {
    constructor(persistence) {
        super();
        persistence.addEventListener(Events.BindingCreated, this.bindingChanged, this);
        persistence.addEventListener(Events.BindingRemoved, this.bindingChanged, this);
    }
    bindingChanged(event) {
        const binding = event.data;
        this.dispatchEventToListeners("LinkIconChanged" /* Components.Linkifier.LinkDecorator.Events.LINK_ICON_CHANGED */, binding.network);
    }
    linkIcon(uiSourceCode) {
        return PersistenceUtils.iconForUISourceCode(uiSourceCode);
    }
}
//# sourceMappingURL=PersistenceUtils.js.map