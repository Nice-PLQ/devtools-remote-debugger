// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as FrontendHelpers from '../../../../../test/unittests/front_end/helpers/TraceHelpers.js';
import * as TimelineModel from '../../../../models/timeline_model/timeline_model.js';
import * as Timeline from '../../../../panels/timeline/timeline.js';
import * as ComponentSetup from '../../helpers/helpers.js';
await ComponentSetup.ComponentServerSetup.setup();
const params = new URLSearchParams(window.location.search);
const track = params.get('track');
const fileName = params.get('fileName');
const expanded = params.get('expanded');
const darkMode = params.get('darkMode');
const customStartWindowTime = params.get('windowStart');
const customEndWindowTime = params.get('windowEnd');
const p = document.createElement('p');
// Expand the track by default for test.
await renderContent(expanded === 'false' ? false : true);
async function renderContent(expanded) {
    if (darkMode) {
        document.documentElement.classList.add('-theme-with-dark-background');
    }
    const container = document.getElementById('container');
    if (!container) {
        throw new Error('could not find container');
    }
    container.appendChild(p);
    if (!track || !fileName) {
        document.title = 'Performance panel track example';
        p.innerText =
            'Use the `track` and `fileName` URL search params to load a track example (f.e. track_example.html?track=Timings&fileName=timings-track)';
        return;
    }
    const file = `${fileName}.json.gz`;
    document.title = `Performance panel ${track} track`;
    p.innerText = `${track} track is loading`;
    p.classList.add('loading');
    let flameChartData;
    try {
        // @ts-expect-error: allow to check if a const string array contains a string.
        if (Timeline.CompatibilityTracksAppender.TrackNames.includes(track)) {
            const trackAppenderName = track;
            flameChartData = await FrontendHelpers.getMainFlameChartWithTracks(file, new Set([trackAppenderName]), expanded);
        }
        else if (track in TimelineModel.TimelineModel.TrackType) {
            flameChartData = await FrontendHelpers.getMainFlameChartWithLegacyTrack(file, track, expanded);
        }
        else if (track === 'Network') {
            flameChartData = await FrontendHelpers.getNetworkFlameChartWithLegacyTrack(file, expanded);
        }
        else {
            p.classList.remove('loading');
            p.innerText = `Invalid track name: ${track}`;
            return;
        }
        container.innerHTML = '';
        const { flameChart, dataProvider } = flameChartData;
        const timingsTrackOffset = flameChart.levelToOffset(dataProvider.maxStackDepth());
        container.style.height = `${timingsTrackOffset}px`;
        if (customStartWindowTime && customEndWindowTime) {
            flameChart.setWindowTimes(Number(customStartWindowTime), Number(customEndWindowTime), false);
        }
        flameChart.show(container);
    }
    catch (error) {
        p.classList.remove('loading');
        p.innerText = error;
        console.error(error);
    }
}
//# sourceMappingURL=track_example.js.map