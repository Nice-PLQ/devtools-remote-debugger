// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Trace from '../../models/trace/trace.js';
import { TimelineUIUtils } from './TimelineUIUtils.js';
export class IsLong extends Trace.Extras.TraceFilter.TraceFilter {
    #minimumRecordDurationMilli = Trace.Types.Timing.Milli(0);
    constructor() {
        super();
    }
    setMinimumRecordDuration(value) {
        this.#minimumRecordDurationMilli = value;
    }
    accept(event) {
        const { duration } = Trace.Helpers.Timing.eventTimingsMilliSeconds(event);
        return duration >= this.#minimumRecordDurationMilli;
    }
}
export class Category extends Trace.Extras.TraceFilter.TraceFilter {
    constructor() {
        super();
    }
    accept(event) {
        return !TimelineUIUtils.eventStyle(event).category.hidden;
    }
}
export class TimelineRegExp extends Trace.Extras.TraceFilter.TraceFilter {
    regExpInternal;
    constructor(regExp) {
        super();
        this.setRegExp(regExp || null);
    }
    setRegExp(regExp) {
        this.regExpInternal = regExp;
    }
    regExp() {
        return this.regExpInternal;
    }
    accept(event, parsedTrace) {
        return !this.regExpInternal || TimelineUIUtils.testContentMatching(event, this.regExpInternal, parsedTrace);
    }
}
//# sourceMappingURL=TimelineFilters.js.map