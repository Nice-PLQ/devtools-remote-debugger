// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../../ui/components/icon_button/icon_button.js';
import './Table.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
import { imageRef } from './EventRef.js';
const { UIStrings, i18nString } = Trace.Insights.Models.ImageDelivery;
const { html } = Lit;
const MAX_REQUESTS = 10;
export class ImageDelivery extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-image-delivery`;
    internalName = 'image-delivery';
    createOverlays() {
        if (!this.model) {
            return [];
        }
        const { optimizableImages } = this.model;
        return optimizableImages.map(image => this.#createOverlayForRequest(image.request));
    }
    #createOverlayForRequest(request) {
        return {
            type: 'ENTRY_OUTLINE',
            entry: request,
            outlineReason: 'ERROR',
        };
    }
    getEstimatedSavingsBytes() {
        return this.model?.totalByteSavings ?? null;
    }
    renderContent() {
        if (!this.model) {
            return Lit.nothing;
        }
        const optimizableImages = [...this.model.optimizableImages];
        const topImages = optimizableImages.sort((a, b) => b.request.args.data.decodedBodyLength - a.request.args.data.decodedBodyLength);
        const remaining = topImages.splice(MAX_REQUESTS);
        const rows = topImages.map(image => ({
            values: [imageRef(image.request)],
            overlays: [this.#createOverlayForRequest(image.request)],
        }));
        if (remaining.length > 0) {
            const value = remaining.length > 1 ? i18nString(UIStrings.others, { PH1: remaining.length }) : imageRef(remaining[0].request);
            rows.push({
                values: [value],
                overlays: remaining.map(r => this.#createOverlayForRequest(r.request)),
            });
        }
        if (!rows.length) {
            return html `<div class="insight-section">${i18nString(UIStrings.noOptimizableImages)}</div>`;
        }
        // clang-format off
        return html `
      <div class="insight-section">
        <devtools-performance-table
          .data=${{
            insight: this,
            headers: [i18nString(UIStrings.optimizeFile)],
            rows,
        }}>
        </devtools-performance-table>
      </div>
    `;
        // clang-format on
    }
}
customElements.define('devtools-performance-image-delivery', ImageDelivery);
//# sourceMappingURL=ImageDelivery.js.map