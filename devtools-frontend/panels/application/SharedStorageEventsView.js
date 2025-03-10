// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';
import * as ApplicationComponents from './components/components.js';
import sharedStorageEventsViewStyles from './sharedStorageEventsView.css.js';
const UIStrings = {
    /**
     *@description Placeholder text if no shared storage event has been selected.
     * Shared storage allows to store and access data that can be shared across different sites.
     * A shared storage event is for example an access from a site to that storage.
     */
    noEventSelected: 'No shared storage event selected',
    /**
     *@description Placeholder text instructing the user how to display shared
     * storage event details.
     * Shared storage allows to store and access data that can be shared across different sites.
     * A shared storage event is for example an access from a site to that storage.
     */
    clickToDisplayBody: 'Click on any shared storage event to display the event parameters',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/SharedStorageEventsView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
function eventEquals(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
export class SharedStorageEventsView extends UI.SplitWidget.SplitWidget {
    #sharedStorageEventGrid = new ApplicationComponents.SharedStorageAccessGrid.SharedStorageAccessGrid();
    #events = [];
    #noDisplayView;
    #defaultId = '';
    constructor() {
        super(/* isVertical */ false, /* secondIsSidebar: */ true);
        this.element.setAttribute('jslog', `${VisualLogging.pane('shared-storage-events')}`);
        const topPanel = new UI.Widget.VBox();
        this.#noDisplayView =
            new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noEventSelected), i18nString(UIStrings.clickToDisplayBody));
        topPanel.setMinimumSize(0, 80);
        this.setMainWidget(topPanel);
        this.#noDisplayView.setMinimumSize(0, 40);
        this.setSidebarWidget(this.#noDisplayView);
        this.hideSidebar();
        topPanel.contentElement.appendChild(this.#sharedStorageEventGrid);
        this.#sharedStorageEventGrid.addEventListener('select', this.#onFocus.bind(this));
        this.#sharedStorageEventGrid.setAttribute('jslog', `${VisualLogging.section('events-table')}`);
        this.#getMainFrameResourceTreeModel()?.addEventListener(SDK.ResourceTreeModel.Events.PrimaryPageChanged, this.clearEvents, this);
    }
    #getMainFrameResourceTreeModel() {
        const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
        return primaryPageTarget?.model(SDK.ResourceTreeModel.ResourceTreeModel) || null;
    }
    #getMainFrame() {
        return this.#getMainFrameResourceTreeModel()?.mainFrame || null;
    }
    get id() {
        return this.#getMainFrame()?.id || this.#defaultId;
    }
    wasShown() {
        super.wasShown();
        const sidebar = this.sidebarWidget();
        if (sidebar) {
            sidebar.registerRequiredCSS(sharedStorageEventsViewStyles);
        }
    }
    addEvent(event) {
        // Only add event if main frame id matches.
        if (event.mainFrameId !== this.id) {
            return;
        }
        // Only add if not already present.
        if (this.#events.some(t => eventEquals(t, event))) {
            return;
        }
        if (this.showMode() !== "Both" /* UI.SplitWidget.ShowMode.BOTH */) {
            this.showBoth();
        }
        this.#events.push(event);
        this.#sharedStorageEventGrid.data = this.#events;
    }
    clearEvents() {
        this.#events = [];
        this.#sharedStorageEventGrid.data = this.#events;
        this.setSidebarWidget(this.#noDisplayView);
        this.hideSidebar();
    }
    async #onFocus(event) {
        const focusedEvent = event;
        const datastore = focusedEvent.detail;
        if (!datastore) {
            return;
        }
        const jsonView = SourceFrame.JSONView.JSONView.createViewSync(datastore);
        jsonView.setMinimumSize(0, 40);
        this.setSidebarWidget(jsonView);
    }
    setDefaultIdForTesting(id) {
        this.#defaultId = id;
    }
    getEventsForTesting() {
        return this.#events;
    }
    getSharedStorageAccessGridForTesting() {
        return this.#sharedStorageEventGrid;
    }
}
//# sourceMappingURL=SharedStorageEventsView.js.map