// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './NodeLink.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
const { html } = Lit;
export class Viewport extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-viewport`;
    internalName = 'viewport';
    createOverlays() {
        // TODO(b/351757418): create overlay for synthetic input delay events
        return [];
    }
    getEstimatedSavingsTime() {
        return this.model?.metricSavings?.INP ?? null;
    }
    renderContent() {
        if (!this.model || !this.model.viewportEvent) {
            return Lit.nothing;
        }
        const backendNodeId = this.model.viewportEvent.args.data.node_id;
        if (backendNodeId === undefined) {
            return Lit.nothing;
        }
        // clang-format off
        return html `
      <div>
        <devtools-performance-node-link
          .data=${{
            backendNodeId,
            frame: this.model.viewportEvent.args.data.frame ?? '',
            options: { tooltip: this.model.viewportEvent.args.data.content },
            fallbackHtmlSnippet: `<meta name=viewport content="${this.model.viewportEvent.args.data.content}">`,
        }}>
        </devtools-performance-node-link>
      </div>`;
        // clang-format on
    }
}
customElements.define('devtools-performance-viewport', Viewport);
//# sourceMappingURL=Viewport.js.map