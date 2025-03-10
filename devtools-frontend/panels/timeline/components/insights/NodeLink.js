// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// TODO: move to ui/components/node_link?
import * as Common from '../../../../core/common/common.js';
import * as Trace from '../../../../models/trace/trace.js';
import * as ComponentHelpers from '../../../../ui/components/helpers/helpers.js';
import * as Lit from '../../../../ui/lit/lit.js';
const { html } = Lit;
export class NodeLink extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #boundRender = this.#render.bind(this);
    #backendNodeId;
    #frame;
    #options;
    #fallbackHtmlSnippet;
    #fallbackText;
    set data(data) {
        this.#backendNodeId = data.backendNodeId;
        this.#frame = data.frame;
        this.#options = data.options;
        this.#fallbackHtmlSnippet = data.fallbackHtmlSnippet;
        this.#fallbackText = data.fallbackText;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#boundRender);
    }
    async #linkify() {
        if (this.#backendNodeId === undefined) {
            return;
        }
        // Users of `NodeLink` do not have a parsed trace so this is a workaround. This
        // is an abuse of this API, but it's currently alright since the first parameter
        // is only used as a cache key.
        const domNodesMap = await Trace.Extras.FetchNodes.domNodesForMultipleBackendNodeIds(this, [this.#backendNodeId]);
        const node = domNodesMap.get(this.#backendNodeId);
        if (!node) {
            return;
        }
        if (node.frameId() !== this.#frame) {
            return;
        }
        // TODO: it'd be nice if we could specify what attributes to render,
        // ex for the Viewport insight: <meta content="..."> (instead of just <meta>)
        return await Common.Linkifier.Linkifier.linkify(node, this.#options);
    }
    async #render() {
        const relatedNodeEl = await this.#linkify();
        let template;
        if (relatedNodeEl) {
            template = html `<div class='node-link'>${relatedNodeEl}</div>`;
        }
        else if (this.#fallbackHtmlSnippet) {
            // TODO: Use CodeHighlighter.
            template = html `<pre style='text-wrap: auto'>${this.#fallbackHtmlSnippet}</pre>`;
        }
        else if (this.#fallbackText) {
            template = html `<span>${this.#fallbackText}</span>`;
        }
        else {
            template = Lit.nothing;
        }
        Lit.render(template, this.#shadow, { host: this });
    }
}
customElements.define('devtools-performance-node-link', NodeLink);
//# sourceMappingURL=NodeLink.js.map