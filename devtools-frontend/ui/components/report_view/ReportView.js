// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { html, nothing, render } from '../../lit/lit.js';
import reportStylesRaw from './report.css.js';
import reportKeyStylesRaw from './reportKey.css.js';
import reportSectionStylesRaw from './reportSection.css.js';
import reportSectionDividerStylesRaw from './reportSectionDivider.css.js';
import reportSectionHeaderStylesRaw from './reportSectionHeader.css.js';
import reportValueStylesRaw from './reportValue.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportStyles = new CSSStyleSheet();
reportStyles.replaceSync(reportStylesRaw.cssContent);
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportKeyStyles = new CSSStyleSheet();
reportKeyStyles.replaceSync(reportKeyStylesRaw.cssContent);
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportSectionStyles = new CSSStyleSheet();
reportSectionStyles.replaceSync(reportSectionStylesRaw.cssContent);
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportSectionDividerStyles = new CSSStyleSheet();
reportSectionDividerStyles.replaceSync(reportSectionDividerStylesRaw.cssContent);
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportSectionHeaderStyles = new CSSStyleSheet();
reportSectionHeaderStyles.replaceSync(reportSectionHeaderStylesRaw.cssContent);
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const reportValueStyles = new CSSStyleSheet();
reportValueStyles.replaceSync(reportValueStylesRaw.cssContent);
export class Report extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #reportTitle = '';
    set data({ reportTitle }) {
        this.#reportTitle = reportTitle;
        this.#render();
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="content">
        ${this.#reportTitle ? html `<div class="report-title">${this.#reportTitle}</div>` : nothing}
        <slot></slot>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export class ReportSection extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportSectionStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="section">
        <slot></slot>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export class ReportSectionHeader extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportSectionHeaderStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="section-header">
        <slot></slot>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export class ReportSectionDivider extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportSectionDividerStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="section-divider">
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export class ReportKey extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportKeyStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="key"><slot></slot></div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export class ReportValue extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [reportValueStyles];
        this.#render();
    }
    #render() {
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="value"><slot></slot></div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
customElements.define('devtools-report', Report);
customElements.define('devtools-report-section', ReportSection);
customElements.define('devtools-report-section-header', ReportSectionHeader);
customElements.define('devtools-report-key', ReportKey);
customElements.define('devtools-report-value', ReportValue);
customElements.define('devtools-report-divider', ReportSectionDivider);
//# sourceMappingURL=ReportView.js.map