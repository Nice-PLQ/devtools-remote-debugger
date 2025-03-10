// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../core/common/common.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as UI from '../../../ui/legacy/legacy.js';
import { html, render } from '../../../ui/lit/lit.js';
import hideIssuesMenuStylesRaw from './hideIssuesMenu.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const hideIssuesMenuStyles = new CSSStyleSheet();
hideIssuesMenuStyles.replaceSync(hideIssuesMenuStylesRaw.cssContent);
const UIStrings = {
    /**
     *@description Title for the tooltip of the (3 dots) Hide Issues menu icon.
     */
    tooltipTitle: 'Hide issues',
};
const str_ = i18n.i18n.registerUIStrings('panels/issues/components/HideIssuesMenu.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class HideIssuesMenu extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #menuItemLabel = Common.UIString.LocalizedEmptyString;
    #menuItemAction = () => { };
    set data(data) {
        this.#menuItemLabel = data.menuItemLabel;
        this.#menuItemAction = data.menuItemAction;
        this.#render();
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [hideIssuesMenuStyles];
    }
    onMenuOpen(event) {
        event.stopPropagation();
        const buttonElement = this.#shadow.querySelector('devtools-button');
        const contextMenu = new UI.ContextMenu.ContextMenu(event, {
            x: buttonElement?.getBoundingClientRect().left,
            y: buttonElement?.getBoundingClientRect().bottom,
        });
        contextMenu.headerSection().appendItem(this.#menuItemLabel, () => this.#menuItemAction(), { jslogContext: 'toggle-similar-issues' });
        void contextMenu.show();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
    <devtools-button
      .data=${{ variant: "icon" /* Buttons.Button.Variant.ICON */, iconName: 'dots-vertical', title: i18nString(UIStrings.tooltipTitle) }}
      .jslogContext=${'hide-issues'}
      class="hide-issues-menu-btn"
      @click=${this.onMenuOpen}></devtools-button>
    `, this.#shadow, { host: this });
    }
}
customElements.define('devtools-hide-issues-menu', HideIssuesMenu);
//# sourceMappingURL=HideIssuesMenu.js.map