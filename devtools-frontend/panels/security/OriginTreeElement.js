// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { SecurityPanelSidebarTreeElement } from './SecurityPanelSidebarTreeElement.js';
export class ShowOriginEvent extends Event {
    static eventName = 'showorigin';
    origin;
    constructor(origin) {
        super(ShowOriginEvent.eventName, { bubbles: true, composed: true });
        this.origin = origin;
    }
}
export class OriginTreeElement extends SecurityPanelSidebarTreeElement {
    #securityStateInternal;
    #renderTreeElement;
    #originInternal = null;
    constructor(className, renderTreeElement, origin = null) {
        super();
        this.#renderTreeElement = renderTreeElement;
        this.#originInternal = origin;
        this.listItemElement.classList.add(className);
        this.#securityStateInternal = null;
        this.setSecurityState("unknown" /* Protocol.Security.SecurityState.Unknown */);
    }
    setSecurityState(newSecurityState) {
        this.#securityStateInternal = newSecurityState;
        this.#renderTreeElement(this);
    }
    securityState() {
        return this.#securityStateInternal;
    }
    origin() {
        return this.#originInternal;
    }
    showElement() {
        this.listItemElement.dispatchEvent(new ShowOriginEvent(this.#originInternal));
    }
}
//# sourceMappingURL=OriginTreeElement.js.map