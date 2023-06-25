// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// eslint-disable-next-line rulesdir/check_component_naming
export class WrappableComponent extends HTMLElement {
    wrapper = null;
    async render() {
    }
    wasShown() {
    }
    willHide() {
    }
}
export function legacyWrapper(base, component) {
    return new class extends base {
        #component;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(..._args) {
            super(/* isWebComponent=*/ true);
            this.#component = component;
            this.#component.wrapper = this;
            void this.#component.render();
            this.contentElement.appendChild(this.#component);
        }
        wasShown() {
            this.#component.wasShown();
            void this.#component.render();
        }
        willHide() {
            this.#component.willHide();
        }
        async doUpdate() {
            await this.#component.render();
        }
        getComponent() {
            return this.#component;
        }
    }();
    // clang-format on
}
//# sourceMappingURL=LegacyWrapper.js.map