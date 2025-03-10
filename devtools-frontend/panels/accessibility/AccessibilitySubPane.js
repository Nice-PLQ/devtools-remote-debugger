// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// eslint-disable-next-line rulesdir/es-modules-import
import objectValueStyles from '../../ui/legacy/components/object_ui/objectValue.css.js';
import * as UI from '../../ui/legacy/legacy.js';
import accessibilityNodeStyles from './accessibilityNode.css.js';
import accessibilityPropertiesStyles from './accessibilityProperties.css.js';
export class AccessibilitySubPane extends UI.View.SimpleView {
    axNode;
    nodeInternal;
    constructor(name) {
        super(name);
        this.registerRequiredCSS(accessibilityPropertiesStyles);
        this.axNode = null;
    }
    setAXNode(_axNode) {
    }
    node() {
        return this.nodeInternal || null;
    }
    setNode(node) {
        this.nodeInternal = node;
    }
    createInfo(textContent, className) {
        const classNameOrDefault = className || 'gray-info-message';
        const info = this.element.createChild('div', classNameOrDefault);
        info.textContent = textContent;
        return info;
    }
    createTreeOutline() {
        const treeOutline = new UI.TreeOutline.TreeOutlineInShadow();
        treeOutline.registerRequiredCSS(accessibilityNodeStyles, accessibilityPropertiesStyles, objectValueStyles);
        treeOutline.element.classList.add('hidden');
        treeOutline.hideOverflow();
        this.element.appendChild(treeOutline.element);
        return treeOutline;
    }
}
//# sourceMappingURL=AccessibilitySubPane.js.map