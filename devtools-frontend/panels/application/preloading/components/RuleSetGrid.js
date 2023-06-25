// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../../core/i18n/i18n.js';
import * as DataGrid from '../../../../ui/components/data_grid/data_grid.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import * as LitHtml from '../../../../ui/lit-html/lit-html.js';
import ruleSetGridStyles from './ruleSetGrid.css.js';
const UIStrings = {
    /**
     *@description Column header for a table displaying rule sets: Indicates a rule set contains errors.
     */
    validity: 'Validity',
    /**
     *@description Column header for a table displaying rule sets: Where a rule set came from.
     */
    location: 'Location',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/preloading/components/RuleSetGrid.ts', UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
// Grid component to show SpeculationRules rule sets.
export class RuleSetGrid extends LegacyWrapper.LegacyWrapper.WrappableComponent {
    static litTagName = LitHtml.literal `devtools-resources-ruleset-grid`;
    #shadow = this.attachShadow({ mode: 'open' });
    #rows = [];
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [ruleSetGridStyles];
        this.#render();
    }
    update(rows) {
        this.#rows = rows;
        this.#render();
    }
    #render() {
        const reportsGridData = {
            columns: [
                {
                    id: 'validity',
                    title: i18nString(UIStrings.validity),
                    widthWeighting: 10,
                    hideable: false,
                    visible: true,
                },
                {
                    id: 'location',
                    title: i18nString(UIStrings.location),
                    widthWeighting: 80,
                    hideable: false,
                    visible: true,
                },
            ],
            rows: this.#buildReportRows(),
        };
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        LitHtml.render(LitHtml.html `
      <div class="ruleset-container">
        <${DataGrid.DataGridController.DataGridController.litTagName} .data=${reportsGridData}>
        </${DataGrid.DataGridController.DataGridController.litTagName}>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
    #buildReportRows() {
        return this.#rows.map(row => ({
            cells: [
                { columnId: 'id', value: row.id },
                { columnId: 'validity', value: row.validity },
                { columnId: 'location', value: row.location },
            ],
        }));
    }
}
ComponentHelpers.CustomElements.defineComponent('devtools-resources-ruleset-grid', RuleSetGrid);
//# sourceMappingURL=RuleSetGrid.js.map