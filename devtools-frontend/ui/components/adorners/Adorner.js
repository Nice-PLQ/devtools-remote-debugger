// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { html, render } from '../../../ui/lit/lit.js';
import * as VisualElements from '../../visual_logging/visual_logging.js';
import adornerStyles from './adorner.css.js';
export class Adorner extends HTMLElement {
    name = '';
    #shadow = this.attachShadow({ mode: 'open' });
    #isToggle = false;
    #ariaLabelDefault;
    #ariaLabelActive;
    #content;
    #jslogContext;
    set data(data) {
        this.name = data.name;
        this.#jslogContext = data.jslogContext;
        if (data.content) {
            data.content.slot = 'content';
            this.#content?.remove();
            this.append(data.content);
            this.#content = data.content;
        }
        this.#render();
    }
    cloneNode(deep) {
        const node = super.cloneNode(deep);
        node.data = { name: this.name, content: this.#content, jslogContext: this.#jslogContext };
        return node;
    }
    connectedCallback() {
        if (!this.getAttribute('aria-label')) {
            this.setAttribute('aria-label', this.name);
        }
        if (this.#jslogContext && !this.getAttribute('jslog')) {
            this.setAttribute('jslog', `${VisualElements.adorner(this.#jslogContext)}`);
        }
    }
    isActive() {
        return this.getAttribute('aria-pressed') === 'true';
    }
    /**
     * Toggle the active state of the adorner. Optionally pass `true` to force-set
     * an active state; pass `false` to force-set an inactive state.
     */
    toggle(forceActiveState) {
        if (!this.#isToggle) {
            return;
        }
        const shouldBecomeActive = forceActiveState === undefined ? !this.isActive() : forceActiveState;
        this.setAttribute('aria-pressed', Boolean(shouldBecomeActive).toString());
        this.setAttribute('aria-label', (shouldBecomeActive ? this.#ariaLabelActive : this.#ariaLabelDefault) || this.name);
    }
    show() {
        this.classList.remove('hidden');
    }
    hide() {
        this.classList.add('hidden');
    }
    /**
     * Make adorner interactive by responding to click events with the provided action
     * and simulating ARIA-capable toggle button behavior.
     */
    addInteraction(action, options) {
        const { isToggle = false, shouldPropagateOnKeydown = false, ariaLabelDefault, ariaLabelActive } = options;
        this.#isToggle = isToggle;
        this.#ariaLabelDefault = ariaLabelDefault;
        this.#ariaLabelActive = ariaLabelActive;
        this.setAttribute('aria-label', ariaLabelDefault);
        if (this.#jslogContext) {
            this.setAttribute('jslog', `${VisualElements.adorner(this.#jslogContext).track({ click: true })}`);
        }
        if (isToggle) {
            this.addEventListener('click', () => {
                this.toggle();
            });
            this.toggle(false /* initialize inactive state */);
        }
        this.addEventListener('click', action);
        // Simulate an ARIA-capable toggle button
        this.classList.add('clickable');
        this.setAttribute('role', 'button');
        this.tabIndex = 0;
        this.addEventListener('keydown', event => {
            if (event.code === 'Enter' || event.code === 'Space') {
                this.click();
                if (!shouldPropagateOnKeydown) {
                    event.stopPropagation();
                }
            }
        });
    }
    #render() {
        render(html `<style>${adornerStyles.cssContent}</style><slot name="content"></slot>`, this.#shadow, { host: this });
    }
}
customElements.define('devtools-adorner', Adorner);
//# sourceMappingURL=Adorner.js.map