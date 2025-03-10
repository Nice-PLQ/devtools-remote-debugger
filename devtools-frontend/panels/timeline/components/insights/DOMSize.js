// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../../ui/components/icon_button/icon_button.js';
import './Table.js';
import './NodeLink.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
const { UIStrings, i18nString } = Trace.Insights.Models.DOMSize;
const { html } = Lit;
export class DOMSize extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-dom-size`;
    internalName = 'dom-size';
    createOverlays() {
        if (!this.model) {
            return [];
        }
        const entries = [...this.model.largeStyleRecalcs, ...this.model.largeLayoutUpdates];
        return entries.map(entry => ({
            type: 'ENTRY_OUTLINE',
            entry,
            outlineReason: 'ERROR',
        }));
    }
    #renderNodeTable(domStatsData) {
        const rows = [];
        if (domStatsData.maxDepth) {
            const { nodeId, nodeName } = domStatsData.maxDepth;
            // clang-format off
            const template = html `
        <devtools-performance-node-link
          .data=${{
                backendNodeId: nodeId,
                frame: domStatsData.frame,
                fallbackText: nodeName,
            }}>
        </devtools-performance-node-link>
      `;
            // clang-format on
            rows.push({ values: [i18nString(UIStrings.maxDOMDepth), template] });
        }
        if (domStatsData.maxChildren) {
            const { nodeId, nodeName } = domStatsData.maxChildren;
            // clang-format off
            const template = html `
        <devtools-performance-node-link
          .data=${{
                backendNodeId: nodeId,
                frame: domStatsData.frame,
                fallbackText: nodeName,
            }}>
        </devtools-performance-node-link>
      `;
            // clang-format on
            rows.push({ values: [i18nString(UIStrings.maxChildren), template] });
        }
        if (!rows.length) {
            return Lit.nothing;
        }
        // clang-format off
        return html `<div class="insight-section">
      <devtools-performance-table
        .data=${{
            insight: this,
            headers: [i18nString(UIStrings.statistic), i18nString(UIStrings.element)],
            rows,
        }}>
      </devtools-performance-table>
    </div>`;
        // clang-format on
    }
    renderContent() {
        if (!this.model) {
            return Lit.nothing;
        }
        const domStatsData = this.model.maxDOMStats?.args.data;
        if (!domStatsData) {
            return Lit.nothing;
        }
        // clang-format off
        return html `<div class="insight-section">
      <devtools-performance-table
        .data=${{
            insight: this,
            headers: [i18nString(UIStrings.statistic), i18nString(UIStrings.value)],
            rows: [
                { values: [i18nString(UIStrings.totalElements), domStatsData.totalElements] },
                { values: [i18nString(UIStrings.maxDOMDepth), domStatsData.maxDepth?.depth ?? 0] },
                { values: [i18nString(UIStrings.maxChildren), domStatsData.maxChildren?.numChildren ?? 0] },
            ],
        }}>
      </devtools-performance-table>
    </div>
    ${this.#renderNodeTable(domStatsData)}
    `;
        // clang-format on
    }
}
customElements.define('devtools-performance-dom-size', DOMSize);
//# sourceMappingURL=DOMSize.js.map