// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../ui/components/panel_feedback/panel_feedback.js';
import '../../../ui/components/panel_introduction_steps/panel_introduction_steps.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import { html, render } from '../../../ui/lit/lit.js';
import cssOverviewStartViewStylesRaw from './cssOverviewStartView.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const cssOverviewStartViewStyles = new CSSStyleSheet();
cssOverviewStartViewStyles.replaceSync(cssOverviewStartViewStylesRaw.cssContent);
const UIStrings = {
    /**
     *@description Label for the capture button in the CSS overview panel
     */
    captureOverview: 'Capture overview',
    /**
     *@description Header for the summary of CSS overview
     */
    identifyCSSImprovements: 'Identify potential CSS improvements',
    /**
     *@description First point of the summarized features of CSS overview
     */
    capturePageCSSOverview: 'Capture an overview of your page’s CSS',
    /**
     *@description Second point of the summarized features of CSS overview
     */
    identifyCSSImprovementsWithExampleIssues: 'Identify potential CSS improvements (e.g. low contrast issues, unused declarations, color or font mismatches)',
    /**
     *@description Third point of the summarized features of CSS overview
     */
    locateAffectedElements: 'Locate the affected elements in the Elements panel',
    /**
     *@description Title of the link to the quick start video and documentation to CSS overview panel
     */
    quickStartWithCSSOverview: 'Quick start: get started with the new CSS overview panel',
};
const str_ = i18n.i18n.registerUIStrings('panels/css_overview/components/CSSOverviewStartView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const FEEDBACK_LINK = 'https://g.co/devtools/css-overview-feedback';
const DOC_LINK = 'https://developer.chrome.com/docs/devtools/css-overview';
export class OverviewStartRequestedEvent extends Event {
    static eventName = 'overviewstartrequested';
    constructor() {
        super(OverviewStartRequestedEvent.eventName);
    }
}
export class CSSOverviewStartView extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [cssOverviewStartViewStyles];
        this.#render();
    }
    show() {
        this.classList.remove('hidden');
    }
    hide() {
        this.classList.add('hidden');
    }
    #onStartCaptureClick() {
        this.dispatchEvent(new OverviewStartRequestedEvent());
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="css-overview-start-view">
        <devtools-panel-introduction-steps>
          <span slot="title">${i18nString(UIStrings.identifyCSSImprovements)}</span>
          <span slot="step-1">${i18nString(UIStrings.capturePageCSSOverview)}</span>
          <span slot="step-2">${i18nString(UIStrings.identifyCSSImprovementsWithExampleIssues)}</span>
          <span slot="step-3">${i18nString(UIStrings.locateAffectedElements)}</span>
        </devtools-panel-introduction-steps>
        <div class="start-capture-wrapper">
          <devtools-button
            class="start-capture"
            .variant=${"primary" /* Buttons.Button.Variant.PRIMARY */}
            .jslogContext=${'css-overview.capture-overview'}
            @click=${this.#onStartCaptureClick}>
            ${i18nString(UIStrings.captureOverview)}
          </devtools-button>
        </div>
        <devtools-panel-feedback .data=${{
            feedbackUrl: FEEDBACK_LINK,
            quickStartUrl: DOC_LINK,
            quickStartLinkText: i18nString(UIStrings.quickStartWithCSSOverview),
        }}>
        </devtools-panel-feedback>
        <devtools-feedback-button .data=${{
            feedbackUrl: FEEDBACK_LINK,
        }}>
        </devtools-feedback-button>
      </div>
    `, this.#shadow, {
            host: this,
        });
        // clang-format on
        const startButton = this.#shadow.querySelector('.start-capture');
        if (startButton) {
            startButton.focus();
        }
    }
}
customElements.define('devtools-css-overview-start-view', CSSOverviewStartView);
//# sourceMappingURL=CSSOverviewStartView.js.map