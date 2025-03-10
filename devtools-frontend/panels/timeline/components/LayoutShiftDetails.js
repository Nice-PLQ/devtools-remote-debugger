// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../core/i18n/i18n.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as Helpers from '../../../models/trace/helpers/helpers.js';
import * as Trace from '../../../models/trace/trace.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as LegacyComponents from '../../../ui/legacy/components/utils/utils.js';
import * as Lit from '../../../ui/lit/lit.js';
import * as Utils from '../utils/utils.js';
import * as Insights from './insights/insights.js';
import layoutShiftDetailsStylesRaw from './layoutShiftDetails.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const layoutShiftDetailsStyles = new CSSStyleSheet();
layoutShiftDetailsStyles.replaceSync(layoutShiftDetailsStylesRaw.cssContent);
const textButtonStyles = new CSSStyleSheet();
textButtonStyles.replaceSync(Buttons.textButtonStyles.cssContent);
const { html } = Lit;
const MAX_URL_LENGTH = 20;
const UIStrings = {
    /**
     * @description Text referring to the start time of a given event.
     */
    startTime: 'Start time',
    /**
     * @description Text for a table header referring to the score of a Layout Shift event.
     */
    shiftScore: 'Shift score',
    /**
     * @description Text for a table header referring to the elements shifted for a Layout Shift event.
     */
    elementsShifted: 'Elements shifted',
    /**
     * @description Text for a table header referring to the culprit of a Layout Shift event.
     */
    culprit: 'Culprit',
    /**
     * @description Text for a culprit type of Injected iframe.
     */
    injectedIframe: 'Injected iframe',
    /**
     * @description Text for a culprit type of Font request.
     */
    fontRequest: 'Font request',
    /**
     * @description Text for a culprit type of non-composited animation.
     */
    nonCompositedAnimation: 'Non-composited animation',
    /**
     * @description Text referring to an animation.
     */
    animation: 'Animation',
    /**
     * @description Text referring to a parent cluster.
     */
    parentCluster: 'Parent cluster',
    /**
     * @description Text referring to a layout shift cluster and its start time.
     * @example {32 ms} PH1
     */
    cluster: 'Layout shift cluster @ {PH1}',
    /**
     * @description Text referring to a layout shift and its start time.
     * @example {32 ms} PH1
     */
    layoutShift: 'Layout shift @ {PH1}',
    /**
     * @description Text referring to the total cumulative score of a layout shift cluster.
     */
    total: 'Total',
    /**
     * @description Text for a culprit type of Unsized image.
     */
    unsizedImage: 'Unsized image',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/components/LayoutShiftDetails.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class LayoutShiftDetails extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #event = null;
    #traceInsightsSets = null;
    #parsedTrace = null;
    #isFreshRecording = false;
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [
            layoutShiftDetailsStyles,
            // Styles for linkifier button.
            textButtonStyles,
        ];
        this.#render();
    }
    setData(event, traceInsightsSets, parsedTrace, isFreshRecording) {
        if (this.#event === event) {
            return;
        }
        this.#event = event;
        this.#traceInsightsSets = traceInsightsSets;
        this.#parsedTrace = parsedTrace;
        this.#isFreshRecording = isFreshRecording;
        this.#render();
    }
    #renderTitle(event) {
        const title = Utils.EntryName.nameForEntry(event);
        return html `
      <div class="layout-shift-details-title">
        <div class="layout-shift-event-title"></div>
        ${title}
      </div>
    `;
    }
    #renderShiftedElements(shift, elementsShifted) {
        // clang-format off
        return html `
      ${elementsShifted?.map(el => {
            if (el.node_id !== undefined) {
                return html `
            <devtools-performance-node-link
              .data=${{
                    backendNodeId: el.node_id,
                    frame: shift.args.frame,
                    // TODO(crbug.com/371620361): if ever rendered for non-fresh traces, this needs to set a fallback text value.
                }}>
            </devtools-performance-node-link>`;
            }
            return Lit.nothing;
        })}`;
        // clang-format on
    }
    #renderIframe(iframeId) {
        const domLoadingId = iframeId;
        if (!domLoadingId) {
            return null;
        }
        const domLoadingFrame = SDK.FrameManager.FrameManager.instance().getFrame(domLoadingId);
        if (!domLoadingFrame) {
            return null;
        }
        const el = LegacyComponents.Linkifier.Linkifier.linkifyRevealable(domLoadingFrame, domLoadingFrame.displayName());
        // clang-format off
        return html `
    <span class="culprit"><span class="culprit-type">${i18nString(UIStrings.injectedIframe)}: </span><span class="culprit-value">${el}</span></span>`;
        // clang-format on
    }
    #renderFontRequest(request) {
        const options = {
            tabStop: true,
            showColumnNumber: false,
            inlineFrameIndex: 0,
            maxLength: MAX_URL_LENGTH,
        };
        const linkifiedURL = LegacyComponents.Linkifier.Linkifier.linkifyURL(request.args.data.url, options);
        // clang-format off
        return html `
    <span class="culprit"><span class="culprit-type">${i18nString(UIStrings.fontRequest)}: </span><span class="culprit-value">${linkifiedURL}</span></span>`;
        // clang-format on
    }
    // TODO(crbug.com/368170718): use eventRef instead
    #clickEvent(event) {
        this.dispatchEvent(new Insights.EventRef.EventReferenceClick(event));
    }
    #renderAnimation(failure) {
        const event = failure.animation;
        if (!event) {
            return null;
        }
        // clang-format off
        return html `
        <span class="culprit">
        <span class="culprit-type">${i18nString(UIStrings.nonCompositedAnimation)}: </span>
        <button type="button" class="culprit-value timeline-link" @click=${() => this.#clickEvent(event)}>${i18nString(UIStrings.animation)}</button>
      </span>`;
        // clang-format on
    }
    #renderUnsizedImage(frame, backendNodeId) {
        // clang-format off
        const el = html `
      <devtools-performance-node-link
        .data=${{
            backendNodeId,
            frame,
            // TODO(crbug.com/371620361): if ever rendered for non-fresh traces, this needs to set a fallback text value. This requires
            // `rootCauses.unsizedImages` to have more than just the backend node id.
        }}>
      </devtools-performance-node-link>`;
        return html `
    <span class="culprit"><span class="culprit-type">${i18nString(UIStrings.unsizedImage)}: </span><span class="culprit-value">${el}</span></span>`;
        // clang-format on
    }
    #renderRootCauseValues(frame, rootCauses) {
        return html `
      ${rootCauses?.fontRequests.map(fontReq => this.#renderFontRequest(fontReq))}
      ${rootCauses?.iframeIds.map(iframe => this.#renderIframe(iframe))}
      ${rootCauses?.nonCompositedAnimations.map(failure => this.#renderAnimation(failure))}
      ${rootCauses?.unsizedImages.map(backendNodeId => this.#renderUnsizedImage(frame, backendNodeId))}
    `;
    }
    #renderStartTime(shift, parsedTrace) {
        const ts = Trace.Types.Timing.Micro(shift.ts - parsedTrace.Meta.traceBounds.min);
        if (shift === this.#event) {
            return html `${i18n.TimeUtilities.preciseMillisToString(Helpers.Timing.microToMilli(ts))}`;
        }
        const shiftTs = i18n.TimeUtilities.formatMicroSecondsTime(ts);
        // clang-format off
        return html `
         <button type="button" class="timeline-link" @click=${() => this.#clickEvent(shift)}>${i18nString(UIStrings.layoutShift, { PH1: shiftTs })}</button>`;
        // clang-format on
    }
    #renderShiftRow(shift, parsedTrace, elementsShifted, rootCauses) {
        const score = shift.args.data?.weighted_score_delta;
        if (!score) {
            return null;
        }
        const hasCulprits = Boolean(rootCauses &&
            (rootCauses.fontRequests.length || rootCauses.iframeIds.length || rootCauses.nonCompositedAnimations.length ||
                rootCauses.unsizedImages.length));
        // TODO(crbug.com/371620361): Needs to show something for non-fresh recordings.
        // clang-format off
        return html `
      <tr class="shift-row" data-ts=${shift.ts}>
        <td>${this.#renderStartTime(shift, parsedTrace)}</td>
        <td>${(score.toFixed(4))}</td>
        ${this.#isFreshRecording ? html `
          <td>
            <div class="elements-shifted">
              ${this.#renderShiftedElements(shift, elementsShifted)}
            </div>
          </td>` : Lit.nothing}
        ${hasCulprits && this.#isFreshRecording ? html `
          <td class="culprits">
            ${this.#renderRootCauseValues(shift.args.frame, rootCauses)}
          </td>` : Lit.nothing}
      </tr>`;
        // clang-format on
    }
    #renderParentCluster(cluster, parsedTrace) {
        if (!cluster) {
            return null;
        }
        const ts = Trace.Types.Timing.Micro(cluster.ts - (parsedTrace?.Meta.traceBounds.min ?? 0));
        const clusterTs = i18n.TimeUtilities.formatMicroSecondsTime(ts);
        // clang-format off
        return html `
      <span class="parent-cluster">${i18nString(UIStrings.parentCluster)}:
         <button type="button" class="timeline-link" @click=${() => this.#clickEvent(cluster)}>${i18nString(UIStrings.cluster, { PH1: clusterTs })}</button>
      </span>`;
        // clang-format on
    }
    #renderClusterTotalRow(cluster) {
        // clang-format off
        return html `
      <td class="total-row">${i18nString(UIStrings.total)}</td>
      <td class="total-row">${(cluster.clusterCumulativeScore.toFixed(4))}</td>`;
        // clang-format on
    }
    #renderShiftDetails(layoutShift, traceInsightsSets, parsedTrace) {
        if (!traceInsightsSets) {
            return null;
        }
        const insightsId = layoutShift.args.data?.navigationId ?? Trace.Types.Events.NO_NAVIGATION;
        const clsInsight = traceInsightsSets.get(insightsId)?.model.CLSCulprits;
        if (!clsInsight || clsInsight instanceof Error) {
            return null;
        }
        const rootCauses = clsInsight.shifts.get(layoutShift);
        const elementsShifted = layoutShift.args.data?.impacted_nodes ?? [];
        const hasCulprits = rootCauses &&
            (rootCauses.fontRequests.length || rootCauses.iframeIds.length || rootCauses.nonCompositedAnimations.length ||
                rootCauses.unsizedImages.length);
        const hasShiftedElements = elementsShifted?.length;
        const parentCluster = clsInsight.clusters.find(cluster => {
            return cluster.events.find(event => event === layoutShift);
        });
        // clang-format off
        return html `
      <table class="layout-shift-details-table">
        <thead class="table-title">
          <tr>
            <th>${i18nString(UIStrings.startTime)}</th>
            <th>${i18nString(UIStrings.shiftScore)}</th>
            ${hasShiftedElements && this.#isFreshRecording ? html `
              <th>${i18nString(UIStrings.elementsShifted)}</th>` : Lit.nothing}
            ${hasCulprits && this.#isFreshRecording ? html `
              <th>${i18nString(UIStrings.culprit)}</th> ` : Lit.nothing}
          </tr>
        </thead>
        <tbody>
          ${this.#renderShiftRow(layoutShift, parsedTrace, elementsShifted, rootCauses)}
        </tbody>
      </table>
      ${this.#renderParentCluster(parentCluster, parsedTrace)}
    `;
        // clang-format on
    }
    #renderClusterDetails(cluster, traceInsightsSets, parsedTrace) {
        if (!traceInsightsSets) {
            return null;
        }
        const insightsId = cluster.navigationId ?? Trace.Types.Events.NO_NAVIGATION;
        const clsInsight = traceInsightsSets.get(insightsId)?.model.CLSCulprits;
        if (!clsInsight || clsInsight instanceof Error) {
            return null;
        }
        // This finds the culprits of the cluster and returns an array of the culprits.
        const clusterCulprits = Array.from(clsInsight.shifts.entries())
            .filter(([key]) => cluster.events.includes(key))
            .map(([, value]) => value)
            .flatMap(x => Object.values(x))
            .flat();
        const hasCulprits = Boolean(clusterCulprits.length);
        // clang-format off
        return html `
          <table class="layout-shift-details-table">
            <thead class="table-title">
              <tr>
                <th>${i18nString(UIStrings.startTime)}</th>
                <th>${i18nString(UIStrings.shiftScore)}</th>
                ${this.#isFreshRecording ? html `
                  <th>${i18nString(UIStrings.elementsShifted)}</th>` : Lit.nothing}
                ${hasCulprits && this.#isFreshRecording ? html `
                  <th>${i18nString(UIStrings.culprit)}</th> ` : Lit.nothing}
              </tr>
            </thead>
            <tbody>
              ${cluster.events.map(shift => {
            const rootCauses = clsInsight.shifts.get(shift);
            const elementsShifted = shift.args.data?.impacted_nodes ?? [];
            return this.#renderShiftRow(shift, parsedTrace, elementsShifted, rootCauses);
        })}
              ${this.#renderClusterTotalRow(cluster)}
            </tbody>
          </table>
        `;
        // clang-format on
    }
    #render() {
        if (!this.#event || !this.#parsedTrace) {
            return;
        }
        // clang-format off
        const output = html `
      <div class="layout-shift-summary-details">
        <div
          class="event-details"
          @mouseover=${this.#togglePopover}
          @mouseleave=${this.#togglePopover}
        >
          ${this.#renderTitle(this.#event)}
          ${Trace.Types.Events.isSyntheticLayoutShift(this.#event)
            ? this.#renderShiftDetails(this.#event, this.#traceInsightsSets, this.#parsedTrace)
            : this.#renderClusterDetails(this.#event, this.#traceInsightsSets, this.#parsedTrace)}
        </div>
      </div>
    `;
        // clang-format on
        Lit.render(output, this.#shadow, { host: this });
    }
    #togglePopover(e) {
        const show = e.type === 'mouseover';
        if (e.type === 'mouseleave') {
            this.dispatchEvent(new CustomEvent('toggle-popover', { detail: { show }, bubbles: true, composed: true }));
        }
        if (!(e.target instanceof HTMLElement) || !this.#event) {
            return;
        }
        const rowEl = e.target.closest('tbody tr');
        if (!rowEl?.parentElement) {
            return;
        }
        // Grab the associated trace event of this row.
        const event = Trace.Types.Events.isSyntheticLayoutShift(this.#event) ?
            this.#event :
            this.#event.events.find(e => e.ts === parseInt(rowEl.getAttribute('data-ts') ?? '', 10));
        this.dispatchEvent(new CustomEvent('toggle-popover', { detail: { event, show }, bubbles: true, composed: true }));
    }
}
customElements.define('devtools-performance-layout-shift-details', LayoutShiftDetails);
//# sourceMappingURL=LayoutShiftDetails.js.map