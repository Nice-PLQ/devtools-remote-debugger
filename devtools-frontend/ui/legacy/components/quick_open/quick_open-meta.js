// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../../core/i18n/i18n.js';
import * as UI from '../../legacy.js';
const UIStrings = {
    /**
     *@description Title of action that opens a file
     */
    openFile: 'Open file',
    /**
     *@description Title of command that runs a Quick Open command
     */
    runCommand: 'Run command',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/quick_open/quick_open-meta.ts', UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(undefined, str_);
let loadedQuickOpenModule;
async function loadQuickOpenModule() {
    if (!loadedQuickOpenModule) {
        loadedQuickOpenModule = await import('./quick_open.js');
    }
    return loadedQuickOpenModule;
}
UI.ActionRegistration.registerActionExtension({
    actionId: 'commandMenu.show',
    category: UI.ActionRegistration.ActionCategory.GLOBAL,
    title: i18nLazyString(UIStrings.runCommand),
    async loadActionDelegate() {
        const QuickOpen = await loadQuickOpenModule();
        return QuickOpen.CommandMenu.ShowActionDelegate.instance();
    },
    bindings: [
        {
            platform: "windows,linux" /* UI.ActionRegistration.Platforms.WindowsLinux */,
            shortcut: 'Ctrl+Shift+P',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
        {
            platform: "mac" /* UI.ActionRegistration.Platforms.Mac */,
            shortcut: 'Meta+Shift+P',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
        {
            shortcut: 'F1',
            keybindSets: [
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
    ],
});
UI.ActionRegistration.registerActionExtension({
    actionId: 'quickOpen.show',
    category: UI.ActionRegistration.ActionCategory.GLOBAL,
    title: i18nLazyString(UIStrings.openFile),
    async loadActionDelegate() {
        const QuickOpen = await loadQuickOpenModule();
        return QuickOpen.QuickOpen.ShowActionDelegate.instance();
    },
    order: 100,
    bindings: [
        {
            platform: "mac" /* UI.ActionRegistration.Platforms.Mac */,
            shortcut: 'Meta+P',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
        {
            platform: "mac" /* UI.ActionRegistration.Platforms.Mac */,
            shortcut: 'Meta+O',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
        {
            platform: "windows,linux" /* UI.ActionRegistration.Platforms.WindowsLinux */,
            shortcut: 'Ctrl+P',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
        {
            platform: "windows,linux" /* UI.ActionRegistration.Platforms.WindowsLinux */,
            shortcut: 'Ctrl+O',
            keybindSets: [
                "devToolsDefault" /* UI.ActionRegistration.KeybindSet.DEVTOOLS_DEFAULT */,
                "vsCode" /* UI.ActionRegistration.KeybindSet.VS_CODE */,
            ],
        },
    ],
});
UI.ContextMenu.registerItem({
    location: UI.ContextMenu.ItemLocation.MAIN_MENU_DEFAULT,
    actionId: 'commandMenu.show',
    order: undefined,
});
UI.ContextMenu.registerItem({
    location: UI.ContextMenu.ItemLocation.MAIN_MENU_DEFAULT,
    actionId: 'quickOpen.show',
    order: undefined,
});
//# sourceMappingURL=quick_open-meta.js.map