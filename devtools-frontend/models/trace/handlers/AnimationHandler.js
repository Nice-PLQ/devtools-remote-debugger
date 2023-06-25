// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Types from '../types/types.js';
const animations = [];
export function reset() {
    animations.length = 0;
}
export function handleEvent(event) {
    if (Types.TraceEvents.isTraceEventAnimation(event)) {
        animations.push(event);
        return;
    }
}
export function data() {
    return { animations };
}
//# sourceMappingURL=AnimationHandler.js.map