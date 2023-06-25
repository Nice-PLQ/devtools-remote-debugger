// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as Root from '../../core/root/root.js';
import { PreRegisteredView } from './ViewManager.js';
const UIStrings = {
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Elements' panel.
     */
    elements: 'Elements',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Drawer' panel.
     */
    drawer: 'Drawer',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Drawer sidebar' panel.
     */
    drawer_sidebar: 'Drawer sidebar',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Panel'.
     */
    panel: 'Panel',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Network' panel.
     */
    network: 'Network',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Settings' panel.
     */
    settings: 'Settings',
    /**
     *@description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Sources' panel.
     */
    sources: 'Sources',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/ViewRegistration.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const registeredViewExtensions = [];
const viewIdSet = new Set();
export function registerViewExtension(registration) {
    const viewId = registration.id;
    Platform.DCHECK(() => !viewIdSet.has(viewId), `Duplicate view id '${viewId}'`);
    viewIdSet.add(viewId);
    registeredViewExtensions.push(new PreRegisteredView(registration));
}
export function getRegisteredViewExtensions() {
    return registeredViewExtensions.filter(view => Root.Runtime.Runtime.isDescriptorEnabled({ experiment: view.experiment(), condition: view.condition() }));
}
export function maybeRemoveViewExtension(viewId) {
    const viewIndex = registeredViewExtensions.findIndex(view => view.viewId() === viewId);
    if (viewIndex < 0 || !viewIdSet.delete(viewId)) {
        return false;
    }
    registeredViewExtensions.splice(viewIndex, 1);
    return true;
}
const registeredLocationResolvers = [];
const viewLocationNameSet = new Set();
export function registerLocationResolver(registration) {
    const locationName = registration.name;
    if (viewLocationNameSet.has(locationName)) {
        throw new Error(`Duplicate view location name registration '${locationName}'`);
    }
    viewLocationNameSet.add(locationName);
    registeredLocationResolvers.push(registration);
}
export function getRegisteredLocationResolvers() {
    return registeredLocationResolvers;
}
export function resetViewRegistration() {
    registeredViewExtensions.length = 0;
    registeredLocationResolvers.length = 0;
    viewLocationNameSet.clear();
    viewIdSet.clear();
}
// eslint-disable-next-line rulesdir/const_enum
export var ViewLocationCategory;
(function (ViewLocationCategory) {
    ViewLocationCategory["NONE"] = "";
    ViewLocationCategory["ELEMENTS"] = "ELEMENTS";
    ViewLocationCategory["DRAWER"] = "DRAWER";
    ViewLocationCategory["DRAWER_SIDEBAR"] = "DRAWER_SIDEBAR";
    ViewLocationCategory["PANEL"] = "PANEL";
    ViewLocationCategory["NETWORK"] = "NETWORK";
    ViewLocationCategory["SETTINGS"] = "SETTINGS";
    ViewLocationCategory["SOURCES"] = "SOURCES";
})(ViewLocationCategory || (ViewLocationCategory = {}));
export function getLocalizedViewLocationCategory(category) {
    switch (category) {
        case ViewLocationCategory.ELEMENTS:
            return i18nString(UIStrings.elements);
        case ViewLocationCategory.DRAWER:
            return i18nString(UIStrings.drawer);
        case ViewLocationCategory.DRAWER_SIDEBAR:
            return i18nString(UIStrings.drawer_sidebar);
        case ViewLocationCategory.PANEL:
            return i18nString(UIStrings.panel);
        case ViewLocationCategory.NETWORK:
            return i18nString(UIStrings.network);
        case ViewLocationCategory.SETTINGS:
            return i18nString(UIStrings.settings);
        case ViewLocationCategory.SOURCES:
            return i18nString(UIStrings.sources);
        case ViewLocationCategory.NONE:
            return i18n.i18n.lockedString('');
    }
}
//# sourceMappingURL=ViewRegistration.js.map