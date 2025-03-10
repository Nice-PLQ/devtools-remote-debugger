// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../core/common/common.js';
import * as UI from '../../../ui/legacy/legacy.js';
import { SidebarAnnotationsTab } from './SidebarAnnotationsTab.js';
import { SidebarInsightsTab } from './SidebarInsightsTab.js';
export class RemoveAnnotation extends Event {
    removedAnnotation;
    static eventName = 'removeannotation';
    constructor(removedAnnotation) {
        super(RemoveAnnotation.eventName, { bubbles: true, composed: true });
        this.removedAnnotation = removedAnnotation;
    }
}
export class RevealAnnotation extends Event {
    annotation;
    static eventName = 'revealannotation';
    constructor(annotation) {
        super(RevealAnnotation.eventName, { bubbles: true, composed: true });
        this.annotation = annotation;
    }
}
export const DEFAULT_SIDEBAR_TAB = "insights" /* SidebarTabs.INSIGHTS */;
export const DEFAULT_SIDEBAR_WIDTH_PX = 240;
const MIN_SIDEBAR_WIDTH_PX = 170;
export class SidebarWidget extends UI.Widget.VBox {
    #tabbedPane = new UI.TabbedPane.TabbedPane();
    #insightsView = new InsightsView();
    #annotationsView = new AnnotationsView();
    /**
     * Track if the user has opened the sidebar before. We do this so that the
     * very first time they record/import a trace after the sidebar ships, we can
     * automatically pop it open to aid discovery. But, after that, the sidebar
     * visibility will be persisted based on if the user opens or closes it - the
     * SplitWidget tracks its state in its own setting.
     */
    #userHasOpenedSidebarOnce = Common.Settings.Settings.instance().createSetting('timeline-user-has-opened-sidebar-once', false);
    userHasOpenedSidebarOnce() {
        return this.#userHasOpenedSidebarOnce.get();
    }
    constructor() {
        super();
        this.setMinimumSize(MIN_SIDEBAR_WIDTH_PX, 0);
        this.#tabbedPane.appendTab("insights" /* SidebarTabs.INSIGHTS */, 'Insights', this.#insightsView, undefined, undefined, false, false, 0, 'timeline.insights-tab');
        this.#tabbedPane.appendTab("annotations" /* SidebarTabs.ANNOTATIONS */, 'Annotations', this.#annotationsView, undefined, undefined, false, false, 1, 'timeline.annotations-tab');
        // Default the selected tab to Insights. In wasShown() we will change this
        // if this is a trace that has no insights.
        this.#tabbedPane.selectTab("insights" /* SidebarTabs.INSIGHTS */);
    }
    wasShown() {
        this.#userHasOpenedSidebarOnce.set(true);
        this.#tabbedPane.show(this.element);
        this.#updateAnnotationsCountBadge();
        // Swap to the Annotations tab if:
        // 1. Insights is currently selected.
        // 2. The Insights tab is disabled (which means we have no insights for this trace)
        if (this.#tabbedPane.selectedTabId === "insights" /* SidebarTabs.INSIGHTS */ &&
            this.#tabbedPane.tabIsDisabled("insights" /* SidebarTabs.INSIGHTS */)) {
            this.#tabbedPane.selectTab("annotations" /* SidebarTabs.ANNOTATIONS */);
        }
    }
    setAnnotations(updatedAnnotations, annotationEntryToColorMap) {
        this.#annotationsView.setAnnotations(updatedAnnotations, annotationEntryToColorMap);
        this.#updateAnnotationsCountBadge();
    }
    #updateAnnotationsCountBadge() {
        const annotations = this.#annotationsView.deduplicatedAnnotations();
        this.#tabbedPane.setBadge('annotations', annotations.length > 0 ? annotations.length.toString() : null);
    }
    setParsedTrace(parsedTrace, metadata) {
        this.#insightsView.setParsedTrace(parsedTrace, metadata);
    }
    setInsights(insights) {
        this.#insightsView.setInsights(insights);
        this.#tabbedPane.setTabEnabled("insights" /* SidebarTabs.INSIGHTS */, insights !== null);
    }
    setActiveInsight(activeInsight) {
        this.#insightsView.setActiveInsight(activeInsight);
        if (activeInsight) {
            this.#tabbedPane.selectTab("insights" /* SidebarTabs.INSIGHTS */);
        }
    }
}
class InsightsView extends UI.Widget.VBox {
    #component = new SidebarInsightsTab();
    constructor() {
        super();
        this.element.classList.add('sidebar-insights');
        this.element.appendChild(this.#component);
    }
    setParsedTrace(parsedTrace, metadata) {
        this.#component.parsedTrace = parsedTrace;
        this.#component.traceMetadata = metadata;
    }
    setInsights(data) {
        this.#component.insights = data;
    }
    setActiveInsight(active) {
        this.#component.activeInsight = active;
    }
}
class AnnotationsView extends UI.Widget.VBox {
    #component = new SidebarAnnotationsTab();
    constructor() {
        super();
        this.element.classList.add('sidebar-annotations');
        this.element.appendChild(this.#component);
    }
    setAnnotations(annotations, annotationEntryToColorMap) {
        // The component will only re-render when set the annotations, so we should
        // set the `annotationEntryToColorMap` first.
        this.#component.annotationEntryToColorMap = annotationEntryToColorMap;
        this.#component.annotations = annotations;
    }
    /**
     * The component "de-duplicates" annotations to ensure implementation details
     * about how we create pending annotations don't leak into the UI. We expose
     * these here because we use this count to show the number of annotations in
     * the small adorner in the sidebar tab.
     */
    deduplicatedAnnotations() {
        return this.#component.deduplicatedAnnotations();
    }
}
//# sourceMappingURL=Sidebar.js.map