// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import { ApplicationPanelTreeElement } from './ApplicationPanelTreeElement.js';
import * as ApplicationComponents from './components/components.js';
import * as Host from '../../core/host/host.js';
const UIStrings = {
    /**
     * @description Hover text for an info icon in the Private State Token panel.
     * Previously known as 'Trust Tokens'.
     */
    trustTokens: 'Private State Tokens',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/TrustTokensTreeElement.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
/** Fetch the Trust Token data regularly from the backend while the panel is open */
const REFRESH_INTERVAL_MS = 1000;
export class TrustTokensTreeElement extends ApplicationPanelTreeElement {
    view;
    constructor(storagePanel) {
        super(storagePanel, i18nString(UIStrings.trustTokens), false);
        const icon = UI.Icon.Icon.create('database', 'resource-tree-item');
        this.setLeadingIcons([icon]);
    }
    get itemURL() {
        return 'trustTokens://';
    }
    onselect(selectedByUser) {
        super.onselect(selectedByUser);
        if (!this.view) {
            this.view = new TrustTokensViewWidgetWrapper(new ApplicationComponents.TrustTokensView.TrustTokensView());
        }
        this.showView(this.view);
        Host.userMetrics.panelShown(Host.UserMetrics.PanelCodes[Host.UserMetrics.PanelCodes.trust_tokens]);
        return false;
    }
}
export class TrustTokensViewWidgetWrapper extends UI.ThrottledWidget.ThrottledWidget {
    trustTokensView;
    constructor(trustTokensView) {
        super(/* isWebComponent */ false, REFRESH_INTERVAL_MS);
        this.trustTokensView = trustTokensView;
        this.contentElement.appendChild(this.trustTokensView);
        this.update();
    }
    async doUpdate() {
        const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
        if (!mainTarget) {
            return;
        }
        const { tokens } = await mainTarget.storageAgent().invoke_getTrustTokens();
        this.trustTokensView.data = {
            tokens,
            deleteClickHandler: (_issuer) => {
                void mainTarget.storageAgent().invoke_clearTrustTokens({ issuerOrigin: _issuer });
            },
        };
        this.update();
    }
}
//# sourceMappingURL=TrustTokensTreeElement.js.map