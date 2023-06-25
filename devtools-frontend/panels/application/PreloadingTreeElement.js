// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';
import { ApplicationPanelTreeElement } from './ApplicationPanelTreeElement.js';
import { PreloadingRuleSetView, PreloadingAttemptView, PreloadingResultView } from './preloading/PreloadingView.js';
const UIStrings = {
    /**
     *@description Text in Application Panel Sidebar of the Application panel
     */
    speculationRules: 'Speculation Rules',
    /**
     *@description Text in Application Panel Sidebar of the Application panel
     */
    preloads: 'Preloads',
    /**
     *@description Text in Application Panel Sidebar of the Application panel
     */
    thisPage: 'This Page',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/PreloadingTreeElement.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class PreloadingTreeElement extends ApplicationPanelTreeElement {
    model;
    ctorV;
    view;
    path;
    #selectedInternal;
    static newForPreloadingRuleSetView(resourcesPanel) {
        return new PreloadingTreeElement(resourcesPanel, PreloadingRuleSetView, 'rule-set', i18nString(UIStrings.speculationRules));
    }
    static newForPreloadingAttemptView(resourcesPanel) {
        return new PreloadingTreeElement(resourcesPanel, PreloadingAttemptView, 'attempt', i18nString(UIStrings.preloads));
    }
    static newForPreloadingResultView(resourcesPanel) {
        return new PreloadingTreeElement(resourcesPanel, PreloadingResultView, 'result', i18nString(UIStrings.thisPage));
    }
    constructor(resourcesPanel, ctorV, path, title) {
        super(resourcesPanel, title, false);
        this.ctorV = ctorV;
        this.path = 'preloading://{path}';
        const icon = UI.Icon.Icon.create('arrow-up-down', 'resource-tree-item');
        this.setLeadingIcons([icon]);
        this.#selectedInternal = false;
        // TODO(https://crbug.com/1384419): Set link
    }
    get itemURL() {
        return this.path;
    }
    initialize(model) {
        this.model = model;
        // Show the view if the model was initialized after selection.
        if (this.#selectedInternal && !this.view) {
            this.onselect(false);
        }
    }
    onselect(selectedByUser) {
        super.onselect(selectedByUser);
        this.#selectedInternal = true;
        if (!this.model) {
            return false;
        }
        if (!this.view) {
            this.view = new this.ctorV(this.model);
        }
        this.showView(this.view);
        // TODO(https://crbug.com/1384419): Report metrics when the panel shown.
        return false;
    }
}
//# sourceMappingURL=PreloadingTreeElement.js.map