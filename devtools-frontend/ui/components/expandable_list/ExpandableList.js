// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Lit from '../../lit/lit.js';
import * as VisualLogging from '../../visual_logging/visual_logging.js';
import expandableListStylesRaw from './expandableList.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const expandableListStyles = new CSSStyleSheet();
expandableListStyles.replaceSync(expandableListStylesRaw.cssContent);
const { html, Directives: { ifDefined } } = Lit;
export class ExpandableList extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #expanded = false;
    #rows = [];
    #title;
    set data(data) {
        this.#rows = data.rows;
        this.#title = data.title;
        this.#render();
    }
    #onArrowClick() {
        this.#expanded = !this.#expanded;
        this.#render();
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [expandableListStyles];
    }
    #render() {
        if (this.#rows.length < 1) {
            return;
        }
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        Lit.render(html `
      <div class="expandable-list-container">
        <div>
          ${this.#rows.length > 1 ?
            html `
              <button title='${ifDefined(this.#title)}' aria-label='${ifDefined(this.#title)}' aria-expanded=${this.#expanded ? 'true' : 'false'} @click=${() => this.#onArrowClick()} class="arrow-icon-button">
                <span class="arrow-icon ${this.#expanded ? 'expanded' : ''}"
                jslog=${VisualLogging.expand().track({ click: true })}></span>
              </button>
            `
            : Lit.nothing}
        </div>
        <div class="expandable-list-items">
          ${this.#rows.filter((_, index) => (this.#expanded || index === 0)).map(row => html `
            ${row}
          `)}
        </div>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
customElements.define('devtools-expandable-list', ExpandableList);
//# sourceMappingURL=ExpandableList.js.map