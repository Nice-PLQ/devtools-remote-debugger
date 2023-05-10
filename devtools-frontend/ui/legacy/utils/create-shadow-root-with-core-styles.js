// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { appendStyle } from './append-style.js';
import { focusChanged } from './focus-changed.js';
import { injectCoreStyles } from './inject-core-styles.js';
export function createShadowRootWithCoreStyles(element, options = {
    delegatesFocus: undefined,
    cssFile: undefined,
}) {
    const { cssFile, delegatesFocus, } = options;
    const shadowRoot = element.attachShadow({ mode: 'open', delegatesFocus });
    injectCoreStyles(shadowRoot);
    if (typeof cssFile === 'string') {
        appendStyle(shadowRoot, cssFile);
    }
    else if (cssFile) {
        shadowRoot.adoptedStyleSheets = cssFile;
    }
    shadowRoot.addEventListener('focus', focusChanged, true);
    return shadowRoot;
}
//# sourceMappingURL=create-shadow-root-with-core-styles.js.map