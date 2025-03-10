// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './Checklist.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
import { imageRef } from './EventRef.js';
const { UIStrings, i18nString } = Trace.Insights.Models.LCPDiscovery;
const { html } = Lit;
// eslint-disable-next-line rulesdir/l10n-filename-matches
const str_ = i18n.i18n.registerUIStrings('models/trace/insights/LCPDiscovery.ts', UIStrings);
function getImageData(model) {
    if (!model.lcpRequest || !model.checklist) {
        return null;
    }
    const shouldIncreasePriorityHint = !model.checklist.priorityHinted.value;
    const shouldPreloadImage = !model.checklist.requestDiscoverable.value;
    const shouldRemoveLazyLoading = !model.checklist.eagerlyLoaded.value;
    const imageLCP = shouldIncreasePriorityHint !== undefined && shouldPreloadImage !== undefined &&
        shouldRemoveLazyLoading !== undefined;
    // Shouldn't render anything if lcp insight is null or lcp is text.
    if (!imageLCP) {
        return null;
    }
    const data = {
        checklist: model.checklist,
        request: model.lcpRequest,
        discoveryDelay: null,
        estimatedSavings: model.metricSavings?.LCP ?? null,
    };
    if (model.earliestDiscoveryTimeTs && model.lcpRequest) {
        const discoveryDelay = model.lcpRequest.ts - model.earliestDiscoveryTimeTs;
        data.discoveryDelay = Trace.Types.Timing.Micro(discoveryDelay);
    }
    return data;
}
export class LCPDiscovery extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-lcp-discovery`;
    internalName = 'lcp-discovery';
    #renderDiscoveryDelay(delay) {
        const timeWrapper = document.createElement('span');
        timeWrapper.classList.add('discovery-time-ms');
        timeWrapper.innerText = i18n.TimeUtilities.formatMicroSecondsTime(delay);
        return i18n.i18n.getFormatLocalizedString(str_, UIStrings.lcpLoadDelay, { PH1: timeWrapper });
    }
    createOverlays() {
        if (!this.model) {
            return [];
        }
        const imageResults = getImageData(this.model);
        if (!imageResults || !imageResults.discoveryDelay) {
            return [];
        }
        const delay = Trace.Helpers.Timing.traceWindowFromMicroSeconds(Trace.Types.Timing.Micro(imageResults.request.ts - imageResults.discoveryDelay), imageResults.request.ts);
        const label = html `<div class="discovery-delay"> ${this.#renderDiscoveryDelay(delay.range)}</div>`;
        return [
            {
                type: 'ENTRY_OUTLINE',
                entry: imageResults.request,
                outlineReason: 'ERROR',
            },
            {
                type: 'CANDY_STRIPED_TIME_RANGE',
                bounds: delay,
                entry: imageResults.request,
            },
            {
                type: 'TIMESPAN_BREAKDOWN',
                sections: [{
                        bounds: delay,
                        label,
                        showDuration: false,
                    }],
                entry: imageResults.request,
                renderLocation: 'ABOVE_EVENT',
            },
        ];
    }
    getEstimatedSavingsTime() {
        if (!this.model) {
            return null;
        }
        return getImageData(this.model)?.estimatedSavings ?? null;
    }
    renderContent() {
        if (!this.model) {
            return Lit.nothing;
        }
        const imageData = getImageData(this.model);
        if (!imageData) {
            if (!this.model.lcpEvent) {
                return html `<div class="insight-section">${i18nString(UIStrings.noLcp)}</div>`;
            }
            return html `<div class="insight-section">${i18nString(UIStrings.noLcpResource)}</div>`;
        }
        // clang-format off
        return html `
      <div class="insight-section">
        <devtools-performance-checklist class="insight-section" .checklist=${imageData.checklist}></devtools-performance-checklist>
        <div class="insight-section">${imageRef(imageData.request)}</div>
      </div>`;
        // clang-format on
    }
}
customElements.define('devtools-performance-lcp-discovery', LCPDiscovery);
//# sourceMappingURL=LCPDiscovery.js.map