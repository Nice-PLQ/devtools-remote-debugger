// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './Table.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as SDK from '../../../../core/sdk/sdk.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as LegacyComponents from '../../../../ui/legacy/components/utils/utils.js';
import * as Lit from '../../../../ui/lit/lit.js';
import { BaseInsightComponent } from './BaseInsightComponent.js';
const { UIStrings, i18nString } = Trace.Insights.Models.ForcedReflow;
const { html } = Lit;
export class ForcedReflow extends BaseInsightComponent {
    static litTagName = Lit.StaticHtml.literal `devtools-performance-forced-reflow`;
    internalName = 'forced-reflow';
    #linkifyUrl(callFrame) {
        const linkifier = new LegacyComponents.Linkifier.Linkifier();
        const stackTrace = {
            callFrames: [
                {
                    functionName: callFrame.functionName,
                    scriptId: callFrame.scriptId,
                    url: callFrame.url,
                    lineNumber: callFrame.lineNumber,
                    columnNumber: callFrame.columnNumber,
                },
            ],
        };
        const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
        const callFrameContents = LegacyComponents.JSPresentationUtils.buildStackTracePreviewContents(target, linkifier, { stackTrace, tabStops: true, showColumnNumber: true });
        return html `${callFrameContents.element}`;
    }
    renderContent() {
        if (!this.model || !this.model.topLevelFunctionCallData) {
            return Lit.nothing;
        }
        const topLevelFunctionCallData = this.model.topLevelFunctionCallData.topLevelFunctionCall;
        const totalReflowTime = this.model.topLevelFunctionCallData.totalReflowTime;
        const bottomUpCallStackData = this.model.aggregatedBottomUpData;
        const time = (us) => i18n.TimeUtilities.millisToString(Platform.Timing.microSecondsToMilliSeconds(us));
        // clang-format off
        return html `
      <div class="insight-section">
        <devtools-performance-table
          .data=${{
            insight: this,
            headers: [i18nString(UIStrings.topTimeConsumingFunctionCall), i18nString(UIStrings.totalReflowTime)],
            rows: [{ values: [this.#linkifyUrl(topLevelFunctionCallData), time(Trace.Types.Timing.Micro(totalReflowTime))] }],
        }}>
        </devtools-performance-table>
      </div>
      <div class="insight-section">
        <devtools-performance-table
          .data=${{
            insight: this,
            headers: [i18nString(UIStrings.relatedStackTrace)],
            rows: bottomUpCallStackData.map(data => ({
                values: [this.#linkifyUrl(data.bottomUpData)],
                overlays: this.#createOverlayForEvents(data.relatedEvents),
            })),
        }}>
        </devtools-performance-table>
      </div>`;
        // clang-format on
    }
    createOverlays() {
        if (!this.model || !this.model.topLevelFunctionCallData) {
            return [];
        }
        return this.#createOverlayForEvents(this.model.topLevelFunctionCallData.topLevelFunctionCallEvents);
    }
    #createOverlayForEvents(events) {
        return events.map(e => ({
            type: 'ENTRY_OUTLINE',
            entry: e,
            outlineReason: 'INFO',
        }));
    }
}
customElements.define('devtools-performance-forced-reflow', ForcedReflow);
//# sourceMappingURL=ForcedReflow.js.map