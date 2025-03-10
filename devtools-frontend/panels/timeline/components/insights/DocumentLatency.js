// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './Checklist.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
const { UIStrings, i18nString } = Trace.Insights.Models.DocumentLatency;
const { html } = Lit;
export class DocumentLatency extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-document-latency`;
    internalName = 'document-latency';
    createOverlays() {
        if (!this.model?.data?.documentRequest) {
            return [];
        }
        const overlays = [];
        const event = this.model.data.documentRequest;
        const redirectDurationMicro = Trace.Helpers.Timing.milliToMicro(this.model.data.redirectDuration);
        const sections = [];
        if (this.model.data.redirectDuration) {
            const bounds = Trace.Helpers.Timing.traceWindowFromMicroSeconds(event.ts, (event.ts + redirectDurationMicro));
            sections.push({ bounds, label: i18nString(UIStrings.redirectsLabel), showDuration: true });
            overlays.push({ type: 'CANDY_STRIPED_TIME_RANGE', bounds, entry: event });
        }
        if (!this.model.data.checklist.serverResponseIsFast.value) {
            const serverResponseTimeMicro = Trace.Helpers.Timing.milliToMicro(this.model.data.serverResponseTime);
            // NOTE: NetworkRequestHandlers never makes a synthetic network request event if `timing` is missing.
            const sendEnd = event.args.data.timing?.sendEnd ?? Trace.Types.Timing.Milli(0);
            const sendEndMicro = Trace.Helpers.Timing.milliToMicro(sendEnd);
            const bounds = Trace.Helpers.Timing.traceWindowFromMicroSeconds(sendEndMicro, (sendEndMicro + serverResponseTimeMicro));
            sections.push({ bounds, label: i18nString(UIStrings.serverResponseTimeLabel), showDuration: true });
        }
        if (this.model.data.uncompressedResponseBytes) {
            const bounds = Trace.Helpers.Timing.traceWindowFromMicroSeconds(event.args.data.syntheticData.downloadStart, (event.args.data.syntheticData.downloadStart + event.args.data.syntheticData.download));
            sections.push({ bounds, label: i18nString(UIStrings.uncompressedDownload), showDuration: true });
            overlays.push({ type: 'CANDY_STRIPED_TIME_RANGE', bounds, entry: event });
        }
        if (sections.length) {
            overlays.push({
                type: 'TIMESPAN_BREAKDOWN',
                sections,
                entry: this.model.data.documentRequest,
                // Always render below because the document request is guaranteed to be
                // the first request in the network track.
                renderLocation: 'BELOW_EVENT',
            });
        }
        overlays.push({
            type: 'ENTRY_SELECTED',
            entry: this.model.data.documentRequest,
        });
        return overlays;
    }
    getEstimatedSavingsTime() {
        return this.model?.metricSavings?.FCP ?? null;
    }
    getEstimatedSavingsBytes() {
        return this.model?.data?.uncompressedResponseBytes ?? null;
    }
    renderContent() {
        if (!this.model?.data) {
            return Lit.nothing;
        }
        // clang-format off
        return html `<devtools-performance-checklist .checklist=${this.model.data.checklist}></devtools-performance-checklist>`;
        // clang-format on
    }
}
customElements.define('devtools-performance-document-latency', DocumentLatency);
//# sourceMappingURL=DocumentLatency.js.map