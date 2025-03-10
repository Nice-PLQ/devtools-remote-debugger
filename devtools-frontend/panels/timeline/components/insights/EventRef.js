// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as Lit from '../../../../ui/lit/lit.js';
import * as Utils from '../../utils/utils.js';
import baseInsightComponentStylesRaw from './baseInsightComponent.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const baseInsightComponentStyles = new CSSStyleSheet();
baseInsightComponentStyles.replaceSync(baseInsightComponentStylesRaw.cssContent);
const { html } = Lit;
export class EventReferenceClick extends Event {
    event;
    static eventName = 'eventreferenceclick';
    constructor(event) {
        super(EventReferenceClick.eventName, { bubbles: true, composed: true });
        this.event = event;
    }
}
class EventRef extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #boundRender = this.#render.bind(this);
    #text = null;
    #event = null;
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [baseInsightComponentStyles];
    }
    set text(text) {
        this.#text = text;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    }
    set event(event) {
        this.#event = event;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    }
    #render() {
        if (!this.#text || !this.#event) {
            return;
        }
        // clang-format off
        Lit.render(html `
      <button type="button" class="timeline-link" @click=${(e) => {
            e.stopPropagation();
            if (this.#event) {
                this.dispatchEvent(new EventReferenceClick(this.#event));
            }
        }}>${this.#text}</button>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
export function eventRef(event, options) {
    let title = options?.title;
    let text = options?.text;
    if (Trace.Types.Events.isSyntheticNetworkRequest(event)) {
        text = text ?? Utils.Helpers.shortenUrl(new URL(event.args.data.url));
        title = title ?? event.args.data.url;
    }
    else {
        Platform.TypeScriptUtilities.assertNever(event, `unsupported event in eventRef: ${event.name}`);
    }
    return html `<devtools-performance-event-ref
    .event=${event}
    .text=${text}
    title=${title}
  ></devtools-performance-event-ref>`;
}
class ImageRef extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #boundRender = this.#render.bind(this);
    #request;
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [baseInsightComponentStyles];
    }
    set request(request) {
        this.#request = request;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    }
    #render() {
        if (!this.#request) {
            return;
        }
        // clang-format off
        Lit.render(html `
      <div class="image-ref">
        ${this.#request.args.data.mimeType.includes('image') ? html `
          <img
            class="element-img"
            src=${this.#request.args.data.url}
            @error=${handleBadImage}/>
        ` : Lit.nothing}
        <span class="element-img-details">
          ${eventRef(this.#request)}
          <span class="element-img-details-size">${i18n.ByteUtilities.bytesToString(this.#request.args.data.decodedBodyLength ?? 0)}</span>
        </span>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
function handleBadImage(event) {
    const img = event.target;
    img.style.display = 'none';
}
export function imageRef(request) {
    return html `
    <devtools-performance-image-ref
      .request=${request}
    ></devtools-performance-image-ref>
  `;
}
customElements.define('devtools-performance-event-ref', EventRef);
customElements.define('devtools-performance-image-ref', ImageRef);
//# sourceMappingURL=EventRef.js.map