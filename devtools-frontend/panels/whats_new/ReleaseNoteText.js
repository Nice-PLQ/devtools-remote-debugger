// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as MarkdownView from '../../ui/components/markdown_view/markdown_view.js';
let registeredLinks = false;
export function setReleaseNoteForTest(testReleaseNote) {
    releaseNote = testReleaseNote;
}
export function getReleaseNote() {
    if (!registeredLinks) {
        for (const { key, link } of releaseNote.markdownLinks) {
            MarkdownView.MarkdownLinksMap.markdownLinks.set(key, link);
        }
        registeredLinks = true;
    }
    return releaseNote;
}
let releaseNote = {
    version: 76,
    header: 'What\'s new in DevTools 135',
    markdownLinks: [
        {
            key: 'perf-script-origin',
            link: 'https://developer.chrome.com/blog/new-in-devtools-135/#perf-script-origin',
        },
        {
            key: 'empty-panels',
            link: 'https://developer.chrome.com/blog/new-in-devtools-135/#empty-panels',
        },
        {
            key: 'accessibility-tree',
            link: 'https://developer.chrome.com/blog/new-in-devtools-135/#accessibility-tree',
        },
    ],
    videoLinks: [
        {
            description: 'See the highlights from Chrome 135',
            link: 'https://developer.chrome.com/blog/new-in-devtools-135',
            type: "WhatsNew" /* VideoType.WHATS_NEW */,
        },
    ],
    link: 'https://developer.chrome.com/blog/new-in-devtools-135/',
};
//# sourceMappingURL=ReleaseNoteText.js.map