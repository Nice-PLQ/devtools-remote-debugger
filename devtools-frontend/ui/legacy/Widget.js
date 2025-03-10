// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 Google Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import '../../core/dom_extension/dom_extension.js';
import * as Platform from '../../core/platform/platform.js';
import * as Lit from '../../ui/lit/lit.js';
import { Constraints, Size } from './Geometry.js';
import * as ThemeSupport from './theme_support/theme_support.js';
import { createShadowRootWithCoreStyles } from './UIUtils.js';
import { XWidget } from './XWidget.js';
// Remember the original DOM mutation methods here, since we
// will override them below to sanity check the Widget system.
const originalAppendChild = Element.prototype.appendChild;
const originalInsertBefore = Element.prototype.insertBefore;
const originalRemoveChild = Element.prototype.removeChild;
const originalRemoveChildren = Element.prototype.removeChildren;
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
export class WidgetConfig {
    widgetClass;
    widgetParams;
    constructor(widgetClass, widgetParams) {
        this.widgetClass = widgetClass;
        this.widgetParams = widgetParams;
    }
}
export function widgetConfig(widgetClass, widgetParams) {
    return new WidgetConfig(widgetClass, widgetParams);
}
export class WidgetElement extends HTMLElement {
    #widgetClass;
    #widgetParams;
    createWidget() {
        if (!this.#widgetClass) {
            throw new Error('No widgetClass defined');
        }
        const widget = new this.#widgetClass(this);
        if (this.#widgetParams) {
            Object.assign(widget, this.#widgetParams);
        }
        widget.requestUpdate();
        return widget;
    }
    set widgetConfig(config) {
        const widget = Widget.get(this);
        if (widget) {
            let needsUpdate = false;
            for (const key in config.widgetParams) {
                if (config.widgetParams.hasOwnProperty(key) && config.widgetParams[key] !== this.#widgetParams?.[key]) {
                    needsUpdate = true;
                }
            }
            if (needsUpdate) {
                Object.assign(widget, config.widgetParams);
                widget.requestUpdate();
            }
        }
        this.#widgetClass = config.widgetClass;
        this.#widgetParams = config.widgetParams;
    }
    connectedCallback() {
        // When using <devtools-widget> we suppress
        // suppressOrphanWidgetError and allow the Widget instance to be
        // treated as a root instance if no root widget was found.
        Widget.getOrCreateWidget(this).show(this.parentElement, undefined, /* suppressOrphanWidgetError= */ true);
    }
    appendChild(child) {
        if (child instanceof HTMLElement && child.tagName !== 'STYLE') {
            Widget.getOrCreateWidget(child).show(this);
            return child;
        }
        return super.appendChild(child);
    }
    insertBefore(child, referenceChild) {
        if (child instanceof HTMLElement && child.tagName !== 'STYLE') {
            Widget.getOrCreateWidget(child).show(this, referenceChild);
            return child;
        }
        return super.insertBefore(child, referenceChild);
    }
    removeChild(child) {
        const childWidget = Widget.get(child);
        if (childWidget) {
            childWidget.detach();
            return child;
        }
        return super.removeChild(child);
    }
    removeChildren() {
        for (const child of this.children) {
            const childWidget = Widget.get(child);
            if (childWidget) {
                childWidget.detach();
            }
        }
        super.removeChildren();
    }
}
customElements.define('devtools-widget', WidgetElement);
export function widgetRef(type, callback) {
    return Lit.Directives.ref((e) => {
        if (!(e instanceof HTMLElement)) {
            return;
        }
        const widget = Widget.getOrCreateWidget(e);
        if (!(widget instanceof type)) {
            throw new Error(`Expected an element with a widget of type ${type.name} but got ${e?.constructor?.name}`);
        }
        callback(widget);
    });
}
const widgetCounterMap = new WeakMap();
const widgetMap = new WeakMap();
function incrementWidgetCounter(parentElement, childElement) {
    const count = (widgetCounterMap.get(childElement) || 0) + (widgetMap.get(childElement) ? 1 : 0);
    for (let el = parentElement; el; el = el.parentElementOrShadowHost()) {
        widgetCounterMap.set(el, (widgetCounterMap.get(el) || 0) + count);
    }
}
function decrementWidgetCounter(parentElement, childElement) {
    const count = (widgetCounterMap.get(childElement) || 0) + (widgetMap.get(childElement) ? 1 : 0);
    for (let el = parentElement; el; el = el.parentElementOrShadowHost()) {
        const elCounter = widgetCounterMap.get(el);
        if (elCounter) {
            widgetCounterMap.set(el, elCounter - count);
        }
    }
}
// The resolved `updateComplete` promise, which is used as a marker for the
// Widget's `#updateComplete` private property to indicate that there's no
// pending update.
const UPDATE_COMPLETE = Promise.resolve(true);
const UPDATE_COMPLETE_RESOLVE = (_result) => { };
export class Widget {
    element;
    contentElement;
    shadowRoot;
    visibleInternal;
    isRoot;
    isShowingInternal;
    childrenInternal;
    hideOnDetach;
    notificationDepth;
    invalidationsSuspended;
    defaultFocusedChild;
    parentWidgetInternal;
    defaultFocusedElement;
    cachedConstraints;
    constraintsInternal;
    invalidationsRequested;
    externallyManaged;
    #updateComplete = UPDATE_COMPLETE;
    #updateCompleteResolve = UPDATE_COMPLETE_RESOLVE;
    #updateRequestID = 0;
    constructor(useShadowDom, delegatesFocus, element) {
        this.element = element || document.createElement('div');
        this.shadowRoot = this.element.shadowRoot;
        if (useShadowDom && !this.shadowRoot) {
            this.element.classList.add('vbox');
            this.element.classList.add('flex-auto');
            this.shadowRoot = createShadowRootWithCoreStyles(this.element, { delegatesFocus });
            this.contentElement = document.createElement('div');
            this.shadowRoot.appendChild(this.contentElement);
        }
        else {
            this.contentElement = this.element;
        }
        this.contentElement.classList.add('widget');
        widgetMap.set(this.element, this);
        this.visibleInternal = false;
        this.isRoot = false;
        this.isShowingInternal = false;
        this.childrenInternal = [];
        this.hideOnDetach = false;
        this.notificationDepth = 0;
        this.invalidationsSuspended = 0;
        this.defaultFocusedChild = null;
        this.parentWidgetInternal = null;
    }
    /**
     * Returns the {@link Widget} whose element is the given `node`, or `undefined`
     * if the `node` is not an element for a widget.
     *
     * @param node a DOM node.
     * @returns the {@link Widget} that is attached to the `node` or `undefined`.
     */
    static get(node) {
        return widgetMap.get(node);
    }
    static getOrCreateWidget(element) {
        const widget = Widget.get(element);
        if (widget) {
            return widget;
        }
        if (element instanceof WidgetElement) {
            return element.createWidget();
        }
        return new Widget(undefined, undefined, element);
    }
    markAsRoot() {
        assert(!this.element.parentElement, 'Attempt to mark as root attached node');
        this.isRoot = true;
    }
    parentWidget() {
        return this.parentWidgetInternal;
    }
    children() {
        return this.childrenInternal;
    }
    childWasDetached(_widget) {
    }
    isShowing() {
        return this.isShowingInternal;
    }
    shouldHideOnDetach() {
        if (!this.element.parentElement) {
            return false;
        }
        if (this.hideOnDetach) {
            return true;
        }
        for (const child of this.childrenInternal) {
            if (child.shouldHideOnDetach()) {
                return true;
            }
        }
        return false;
    }
    setHideOnDetach() {
        this.hideOnDetach = true;
    }
    inNotification() {
        return Boolean(this.notificationDepth) || Boolean(this.parentWidgetInternal?.inNotification());
    }
    parentIsShowing() {
        if (this.isRoot) {
            return true;
        }
        return this.parentWidgetInternal?.isShowing() ?? false;
    }
    callOnVisibleChildren(method) {
        const copy = this.childrenInternal.slice();
        for (let i = 0; i < copy.length; ++i) {
            if (copy[i].parentWidgetInternal === this && copy[i].visibleInternal) {
                method.call(copy[i]);
            }
        }
    }
    processWillShow() {
        this.callOnVisibleChildren(this.processWillShow);
        this.isShowingInternal = true;
    }
    processWasShown() {
        if (this.inNotification()) {
            return;
        }
        this.restoreScrollPositions();
        this.notify(this.wasShown);
        this.callOnVisibleChildren(this.processWasShown);
    }
    processWillHide() {
        if (this.inNotification()) {
            return;
        }
        this.storeScrollPositions();
        this.callOnVisibleChildren(this.processWillHide);
        this.notify(this.willHide);
        this.isShowingInternal = false;
    }
    processWasHidden() {
        this.callOnVisibleChildren(this.processWasHidden);
    }
    processOnResize() {
        if (this.inNotification()) {
            return;
        }
        if (!this.isShowing()) {
            return;
        }
        this.notify(this.onResize);
        this.callOnVisibleChildren(this.processOnResize);
    }
    notify(notification) {
        ++this.notificationDepth;
        try {
            notification.call(this);
        }
        finally {
            --this.notificationDepth;
        }
    }
    wasShown() {
    }
    willHide() {
    }
    onResize() {
    }
    onLayout() {
    }
    onDetach() {
    }
    async ownerViewDisposed() {
    }
    show(parentElement, insertBefore, suppressOrphanWidgetError = false) {
        assert(parentElement, 'Attempt to attach widget with no parent element');
        if (!this.isRoot) {
            // Update widget hierarchy.
            let currentParent = parentElement;
            let currentWidget = undefined;
            while (!currentWidget) {
                if (!currentParent) {
                    if (suppressOrphanWidgetError) {
                        this.isRoot = true;
                        console.warn('A Widget has silently been marked as a root widget');
                        this.show(parentElement, insertBefore);
                        return;
                    }
                    throw new Error('Attempt to attach widget to orphan node');
                }
                currentWidget = widgetMap.get(currentParent);
                currentParent = currentParent.parentElementOrShadowHost();
            }
            this.attach(currentWidget);
        }
        this.showWidgetInternal(parentElement, insertBefore);
    }
    attach(parentWidget) {
        if (parentWidget === this.parentWidgetInternal) {
            return;
        }
        if (this.parentWidgetInternal) {
            this.detach();
        }
        this.parentWidgetInternal = parentWidget;
        this.parentWidgetInternal.childrenInternal.push(this);
        this.isRoot = false;
    }
    showWidget() {
        if (this.visibleInternal) {
            return;
        }
        if (!this.element.parentElement) {
            throw new Error('Attempt to show widget that is not hidden using hideWidget().');
        }
        this.showWidgetInternal(this.element.parentElement, this.element.nextSibling);
    }
    showWidgetInternal(parentElement, insertBefore) {
        let currentParent = parentElement;
        while (currentParent && !widgetMap.get(currentParent)) {
            currentParent = currentParent.parentElementOrShadowHost();
        }
        if (this.isRoot) {
            assert(!currentParent, 'Attempt to show root widget under another widget');
        }
        else {
            assert(currentParent && widgetMap.get(currentParent) === this.parentWidgetInternal, 'Attempt to show under node belonging to alien widget');
        }
        const wasVisible = this.visibleInternal;
        if (wasVisible && this.element.parentElement === parentElement) {
            return;
        }
        this.visibleInternal = true;
        if (!wasVisible && this.parentIsShowing()) {
            this.processWillShow();
        }
        this.element.classList.remove('hidden');
        // Reparent
        if (this.element.parentElement !== parentElement) {
            if (!this.externallyManaged) {
                incrementWidgetCounter(parentElement, this.element);
            }
            if (insertBefore) {
                originalInsertBefore.call(parentElement, this.element, insertBefore);
            }
            else {
                originalAppendChild.call(parentElement, this.element);
            }
        }
        if (!wasVisible && this.parentIsShowing()) {
            this.processWasShown();
        }
        if (this.parentWidgetInternal && this.hasNonZeroConstraints()) {
            this.parentWidgetInternal.invalidateConstraints();
        }
        else {
            this.processOnResize();
        }
    }
    hideWidget() {
        if (!this.visibleInternal) {
            return;
        }
        this.hideWidgetInternal(false);
    }
    hideWidgetInternal(removeFromDOM) {
        this.visibleInternal = false;
        const { parentElement } = this.element;
        if (this.parentIsShowing()) {
            this.processWillHide();
        }
        if (removeFromDOM) {
            if (parentElement) {
                // Force legal removal
                decrementWidgetCounter(parentElement, this.element);
                originalRemoveChild.call(parentElement, this.element);
            }
            this.onDetach();
        }
        else {
            this.element.classList.add('hidden');
        }
        if (this.parentIsShowing()) {
            this.processWasHidden();
        }
        if (this.parentWidgetInternal && this.hasNonZeroConstraints()) {
            this.parentWidgetInternal.invalidateConstraints();
        }
    }
    detach(overrideHideOnDetach) {
        if (!this.parentWidgetInternal && !this.isRoot) {
            return;
        }
        // Cancel any pending update.
        if (this.#updateRequestID !== 0) {
            cancelAnimationFrame(this.#updateRequestID);
            this.#updateCompleteResolve(true);
            this.#updateCompleteResolve = UPDATE_COMPLETE_RESOLVE;
            this.#updateComplete = UPDATE_COMPLETE;
            this.#updateRequestID = 0;
        }
        // hideOnDetach means that we should never remove element from dom - content
        // has iframes and detaching it will hurt.
        //
        // overrideHideOnDetach will override hideOnDetach and the client takes
        // responsibility for the consequences.
        const removeFromDOM = overrideHideOnDetach || !this.shouldHideOnDetach();
        if (this.visibleInternal) {
            this.hideWidgetInternal(removeFromDOM);
        }
        else if (removeFromDOM) {
            const { parentElement } = this.element;
            if (parentElement) {
                // Force kick out from DOM.
                decrementWidgetCounter(parentElement, this.element);
                originalRemoveChild.call(parentElement, this.element);
            }
        }
        // Update widget hierarchy.
        if (this.parentWidgetInternal) {
            const childIndex = this.parentWidgetInternal.childrenInternal.indexOf(this);
            assert(childIndex >= 0, 'Attempt to remove non-child widget');
            this.parentWidgetInternal.childrenInternal.splice(childIndex, 1);
            if (this.parentWidgetInternal.defaultFocusedChild === this) {
                this.parentWidgetInternal.defaultFocusedChild = null;
            }
            this.parentWidgetInternal.childWasDetached(this);
            this.parentWidgetInternal = null;
        }
        else {
            assert(this.isRoot, 'Removing non-root widget from DOM');
        }
    }
    detachChildWidgets() {
        const children = this.childrenInternal.slice();
        for (let i = 0; i < children.length; ++i) {
            children[i].detach();
        }
    }
    elementsToRestoreScrollPositionsFor() {
        return [this.element];
    }
    storeScrollPositions() {
        const elements = this.elementsToRestoreScrollPositionsFor();
        for (const container of elements) {
            storedScrollPositions.set(container, { scrollLeft: container.scrollLeft, scrollTop: container.scrollTop });
        }
    }
    restoreScrollPositions() {
        const elements = this.elementsToRestoreScrollPositionsFor();
        for (const container of elements) {
            const storedPositions = storedScrollPositions.get(container);
            if (storedPositions) {
                container.scrollLeft = storedPositions.scrollLeft;
                container.scrollTop = storedPositions.scrollTop;
            }
        }
    }
    doResize() {
        if (!this.isShowing()) {
            return;
        }
        // No matter what notification we are in, dispatching onResize is not needed.
        if (!this.inNotification()) {
            this.callOnVisibleChildren(this.processOnResize);
        }
    }
    doLayout() {
        if (!this.isShowing()) {
            return;
        }
        this.notify(this.onLayout);
        this.doResize();
    }
    registerRequiredCSS(...cssFiles) {
        for (const cssFile of cssFiles) {
            ThemeSupport.ThemeSupport.instance().appendStyle(this.shadowRoot ?? this.element, cssFile);
        }
    }
    // Unused, but useful for debugging.
    printWidgetHierarchy() {
        const lines = [];
        this.collectWidgetHierarchy('', lines);
        console.log(lines.join('\n')); // eslint-disable-line no-console
    }
    collectWidgetHierarchy(prefix, lines) {
        lines.push(prefix + '[' + this.element.className + ']' + (this.childrenInternal.length ? ' {' : ''));
        for (let i = 0; i < this.childrenInternal.length; ++i) {
            this.childrenInternal[i].collectWidgetHierarchy(prefix + '    ', lines);
        }
        if (this.childrenInternal.length) {
            lines.push(prefix + '}');
        }
    }
    setDefaultFocusedElement(element) {
        this.defaultFocusedElement = element;
    }
    setDefaultFocusedChild(child) {
        assert(child.parentWidgetInternal === this, 'Attempt to set non-child widget as default focused.');
        this.defaultFocusedChild = child;
    }
    focus() {
        if (!this.isShowing()) {
            return;
        }
        const element = this.defaultFocusedElement;
        if (element) {
            if (!element.hasFocus()) {
                element.focus();
            }
            return;
        }
        if (this.defaultFocusedChild?.visibleInternal) {
            this.defaultFocusedChild.focus();
        }
        else {
            for (const child of this.childrenInternal) {
                if (child.visibleInternal) {
                    child.focus();
                    return;
                }
            }
            let child = this.contentElement.traverseNextNode(this.contentElement);
            while (child) {
                if (child instanceof XWidget) {
                    child.focus();
                    return;
                }
                child = child.traverseNextNode(this.contentElement);
            }
        }
    }
    hasFocus() {
        return this.element.hasFocus();
    }
    calculateConstraints() {
        return new Constraints();
    }
    constraints() {
        if (typeof this.constraintsInternal !== 'undefined') {
            return this.constraintsInternal;
        }
        if (typeof this.cachedConstraints === 'undefined') {
            this.cachedConstraints = this.calculateConstraints();
        }
        return this.cachedConstraints;
    }
    setMinimumAndPreferredSizes(width, height, preferredWidth, preferredHeight) {
        this.constraintsInternal = new Constraints(new Size(width, height), new Size(preferredWidth, preferredHeight));
        this.invalidateConstraints();
    }
    setMinimumSize(width, height) {
        this.minimumSize = new Size(width, height);
    }
    set minimumSize(size) {
        this.constraintsInternal = new Constraints(size);
        this.invalidateConstraints();
    }
    hasNonZeroConstraints() {
        const constraints = this.constraints();
        return Boolean(constraints.minimum.width || constraints.minimum.height || constraints.preferred.width ||
            constraints.preferred.height);
    }
    suspendInvalidations() {
        ++this.invalidationsSuspended;
    }
    resumeInvalidations() {
        --this.invalidationsSuspended;
        if (!this.invalidationsSuspended && this.invalidationsRequested) {
            this.invalidateConstraints();
        }
    }
    invalidateConstraints() {
        if (this.invalidationsSuspended) {
            this.invalidationsRequested = true;
            return;
        }
        this.invalidationsRequested = false;
        const cached = this.cachedConstraints;
        delete this.cachedConstraints;
        const actual = this.constraints();
        if (!actual.isEqual(cached || null) && this.parentWidgetInternal) {
            this.parentWidgetInternal.invalidateConstraints();
        }
        else {
            this.doLayout();
        }
    }
    // Excludes the widget from being tracked by its parents/ancestors via
    // widgetCounter because the widget is being handled by external code.
    // Widgets marked as being externally managed are responsible for
    // finishing out their own lifecycle (i.e. calling detach() before being
    // removed from the DOM). This is e.g. used for CodeMirror.
    //
    // Also note that this must be called before the widget is shown so that
    // so that its ancestor's widgetCounter is not incremented.
    markAsExternallyManaged() {
        assert(!this.parentWidgetInternal, 'Attempt to mark widget as externally managed after insertion to the DOM');
        this.externallyManaged = true;
    }
    /**
     * Override this method in derived classes to perform the actual view update.
     *
     * This is not meant to be called directly, but invoked (indirectly) through
     * the `requestAnimationFrame` and executed with the animation frame. Instead,
     * use the `requestUpdate()` method to schedule an asynchronous update.
     *
     * @return can either return nothing or a promise; in that latter case, the
     *         update logic will await the resolution of the returned promise
     *         before proceeding.
     */
    performUpdate() {
    }
    async #performUpdateCallback() {
        // Mark this update cycle as complete by assigning
        // the marker sentinel.
        this.#updateComplete = UPDATE_COMPLETE;
        this.#updateCompleteResolve = UPDATE_COMPLETE_RESOLVE;
        this.#updateRequestID = 0;
        // Run the actual update logic.
        await this.performUpdate();
        // Resolve the `updateComplete` with `true` if no
        // new update was triggered during this cycle.
        return this.#updateComplete === UPDATE_COMPLETE;
    }
    /**
     * Schedules an asynchronous update for this widget.
     *
     * The update will be deduplicated and executed with the next animation
     * frame.
     */
    requestUpdate() {
        if (this.#updateComplete === UPDATE_COMPLETE) {
            this.#updateComplete = new Promise((resolve, reject) => {
                this.#updateCompleteResolve = resolve;
                this.#updateRequestID = requestAnimationFrame(() => this.#performUpdateCallback().then(resolve, reject));
            });
        }
    }
    /**
     * The `updateComplete` promise resolves when the widget has finished updating.
     *
     * Use `updateComplete` to wait for an update:
     * ```js
     * await widget.updateComplete;
     * // do stuff
     * ```
     *
     * This method is primarily useful for unit tests, to wait for widgets to build
     * their DOM. For example:
     * ```js
     * // Set up the test widget, and wait for the initial update cycle to complete.
     * const widget = new SomeWidget(someData);
     * widget.requestUpdate();
     * await widget.updateComplete;
     *
     * // Assert state of the widget.
     * assert.isTrue(widget.someDataLoaded);
     * ```
     *
     * @returns a promise that resolves to a `boolean` when the widget has finished
     *          updating, the value is `true` if there are no more pending updates,
     *          and `false` if the update cycle triggered another update.
     */
    get updateComplete() {
        return this.#updateComplete;
    }
}
const storedScrollPositions = new WeakMap();
export class VBox extends Widget {
    constructor(useShadowDom, delegatesFocus, element) {
        if (useShadowDom instanceof HTMLElement) {
            element = useShadowDom;
            useShadowDom = false;
        }
        super(useShadowDom, delegatesFocus, element);
        this.contentElement.classList.add('vbox');
    }
    calculateConstraints() {
        let constraints = new Constraints();
        function updateForChild() {
            const child = this.constraints();
            constraints = constraints.widthToMax(child);
            constraints = constraints.addHeight(child);
        }
        this.callOnVisibleChildren(updateForChild);
        return constraints;
    }
}
export class HBox extends Widget {
    constructor(useShadowDom) {
        super(useShadowDom);
        this.contentElement.classList.add('hbox');
    }
    calculateConstraints() {
        let constraints = new Constraints();
        function updateForChild() {
            const child = this.constraints();
            constraints = constraints.addWidth(child);
            constraints = constraints.heightToMax(child);
        }
        this.callOnVisibleChildren(updateForChild);
        return constraints;
    }
}
export class VBoxWithResizeCallback extends VBox {
    resizeCallback;
    constructor(resizeCallback) {
        super();
        this.resizeCallback = resizeCallback;
    }
    onResize() {
        this.resizeCallback();
    }
}
export class WidgetFocusRestorer {
    widget;
    previous;
    constructor(widget) {
        this.widget = widget;
        this.previous = Platform.DOMUtilities.deepActiveElement(widget.element.ownerDocument);
        widget.focus();
    }
    restore() {
        if (!this.widget) {
            return;
        }
        if (this.widget.hasFocus() && this.previous) {
            this.previous.focus();
        }
        this.previous = null;
        this.widget = null;
    }
}
Element.prototype.appendChild = function (node) {
    if (widgetMap.get(node) && node.parentElement !== this) {
        throw new Error('Attempt to add widget via regular DOM operation.');
    }
    return originalAppendChild.call(this, node);
};
Element.prototype.insertBefore = function (node, child) {
    if (widgetMap.get(node) && node.parentElement !== this) {
        throw new Error('Attempt to add widget via regular DOM operation.');
    }
    return originalInsertBefore.call(this, node, child);
};
Element.prototype.removeChild = function (child) {
    if (widgetCounterMap.get(child) || widgetMap.get(child)) {
        throw new Error('Attempt to remove element containing widget via regular DOM operation');
    }
    return originalRemoveChild.call(this, child);
};
Element.prototype.removeChildren = function () {
    if (widgetCounterMap.get(this)) {
        throw new Error('Attempt to remove element containing widget via regular DOM operation');
    }
    return originalRemoveChildren.call(this);
};
//# sourceMappingURL=Widget.js.map