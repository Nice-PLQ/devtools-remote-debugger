// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
export class CSSFontFace {
    #fontFamily;
    #fontVariationAxes;
    #fontVariationAxesByTag;
    constructor(payload) {
        this.#fontFamily = payload.fontFamily;
        this.#fontVariationAxes = payload.fontVariationAxes || [];
        this.#fontVariationAxesByTag = new Map();
        for (const axis of this.#fontVariationAxes) {
            this.#fontVariationAxesByTag.set(axis.tag, axis);
        }
    }
    getFontFamily() {
        return this.#fontFamily;
    }
    getVariationAxisByTag(tag) {
        return this.#fontVariationAxesByTag.get(tag);
    }
}
//# sourceMappingURL=CSSFontFace.js.map