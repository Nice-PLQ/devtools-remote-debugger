// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';
import { buildGroupStyle, buildTrackHeader } from './AppenderUtils.js';
const UIStrings = {
    /**
     *@description Text in Timeline Flame Chart Data Provider of the Performance panel
     */
    serverTimingTrack: 'This track contains timings taken from Server-Timing network response headers. Their respective start times are only estimated and may not be accurate.',
    /**
     * @description Server Side refers to activity happening in the server in the context of an HTTP request.
     * @example {origin} PH1
     */
    serverSideTrack: 'Server Timings — {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/ServerTimingsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class ServerTimingsTrackAppender {
    appenderName = 'ServerTimings';
    #parsedTrace;
    #compatibilityBuilder;
    constructor(compatibilityBuilder, parsedTrace) {
        this.#parsedTrace = parsedTrace;
        this.#compatibilityBuilder = compatibilityBuilder;
    }
    appendTrackAtLevel(trackStartLevel, expanded) {
        if (!Root.Runtime.experiments.isEnabled("timeline-server-timings" /* Root.Runtime.ExperimentName.TIMELINE_SERVER_TIMINGS */)) {
            return trackStartLevel;
        }
        if (this.#parsedTrace.ServerTimings.serverTimings.length === 0) {
            return trackStartLevel;
        }
        let lastLevel = trackStartLevel;
        const serverTimingsByOrigin = Object.groupBy(this.#parsedTrace.ServerTimings.serverTimings, serverTiming => serverTiming.args.data.origin);
        for (const [origin, serverTimings] of Object.entries(serverTimingsByOrigin)) {
            if (!serverTimings || serverTimings.length === 0) {
                continue;
            }
            this.#appendTopLevelHeaderAtLevel(lastLevel, origin, expanded);
            lastLevel = this.#appendServerTimings(lastLevel, serverTimings);
        }
        return lastLevel;
    }
    /**
     * Appends the top level header for a track. Extension entries can be
     * added to tracks or sub-tracks. In the former case, the top level
     * header corresponds to the track name, in the latter it corresponds
     * to the track group name.
     */
    #appendTopLevelHeaderAtLevel(currentLevel, origin, expanded) {
        const style = buildGroupStyle({ shareHeaderLine: false, collapsible: true });
        const headerTitle = i18nString(UIStrings.serverSideTrack, { PH1: origin });
        const group = buildTrackHeader("server.timings" /* VisualLoggingTrackName.SERVER_TIMINGS */, currentLevel, headerTitle, style, 
        /* selectable= */ true, expanded);
        group.description = i18nString(UIStrings.serverTimingTrack);
        this.#compatibilityBuilder.registerTrackForGroup(group, this);
    }
    #appendServerTimings(trackStartLevel, serverTimings) {
        let currentStartLevel = trackStartLevel;
        currentStartLevel = this.#compatibilityBuilder.appendEventsAtLevel(serverTimings, currentStartLevel, this);
        return currentStartLevel;
    }
    colorForEvent() {
        return ThemeSupport.ThemeSupport.instance().getComputedValue('--ref-palette-primary70');
    }
}
//# sourceMappingURL=ServerTimingsTrackAppender.js.map