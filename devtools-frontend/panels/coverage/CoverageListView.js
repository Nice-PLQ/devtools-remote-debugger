// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Platform from '../../core/platform/platform.js';
import * as Formatter from '../../models/formatter/formatter.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';
import coverageListViewStyles from './coverageListView.css.js';
const UIStrings = {
    /**
    *@description Text that appears on a button for the css resource type filter.
    */
    css: 'CSS',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    jsPerFunction: 'JS (per function)',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    jsPerBlock: 'JS (per block)',
    /**
    *@description Text for web URLs
    */
    url: 'URL',
    /**
    *@description Text that refers to some types
    */
    type: 'Type',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    totalBytes: 'Total Bytes',
    /**
    *@description Text in Coverage List View of the Coverage tab
    */
    unusedBytes: 'Unused Bytes',
    /**
    *@description Text in the Coverage List View of the Coverage Tab
    */
    usageVisualization: 'Usage Visualization',
    /**
    *@description Data grid name for Coverage data grids
    */
    codeCoverage: 'Code Coverage',
    /**
    *@description Cell title in Coverage List View of the Coverage tab. The coverage tool tells
    *developers which functions (logical groups of lines of code) were actually run/executed. If a
    *function does get run, then it is marked in the UI to indicate that it was covered.
    */
    jsCoverageWithPerFunction: 'JS coverage with per function granularity: Once a function was executed, the whole function is marked as covered.',
    /**
    *@description Cell title in Coverage List View of the Coverage tab. The coverage tool tells
    *developers which blocks (logical groups of lines of code, smaller than a function) were actually
    *run/executed. If a block does get run, then it is marked in the UI to indicate that it was
    *covered.
    */
    jsCoverageWithPerBlock: 'JS coverage with per block granularity: Once a block of JavaScript was executed, that block is marked as covered.',
    /**
    *@description Accessible text for the value in bytes in memory allocation or coverage view.
    */
    sBytes: '{n, plural, =1 {# byte} other {# bytes}}',
    /**
    *@description Accessible text for the unused bytes column in the coverage tool that describes the total unused bytes and percentage of the file unused.
    *@example {88%} percentage
    */
    sBytesS: '{n, plural, =1 {# byte, {percentage}} other {# bytes, {percentage}}}',
    /**
    *@description Tooltip text for the bar in the coverage list view of the coverage tool that illustrates the relation between used and unused bytes.
    *@example {1000} PH1
    *@example {12.34} PH2
    */
    sBytesSBelongToFunctionsThatHave: '{PH1} bytes ({PH2}) belong to functions that have not (yet) been executed.',
    /**
    *@description Tooltip text for the bar in the coverage list view of the coverage tool that illustrates the relation between used and unused bytes.
    *@example {1000} PH1
    *@example {12.34} PH2
    */
    sBytesSBelongToBlocksOf: '{PH1} bytes ({PH2}) belong to blocks of JavaScript that have not (yet) been executed.',
    /**
    *@description Message in Coverage View of the Coverage tab
    *@example {1000} PH1
    *@example {12.34} PH2
    */
    sBytesSBelongToFunctionsThatHaveExecuted: '{PH1} bytes ({PH2}) belong to functions that have executed at least once.',
    /**
    *@description Message in Coverage View of the Coverage tab
    *@example {1000} PH1
    *@example {12.34} PH2
    */
    sBytesSBelongToBlocksOfJavascript: '{PH1} bytes ({PH2}) belong to blocks of JavaScript that have executed at least once.',
    /**
    *@description Accessible text for the visualization column of coverage tool. Contains percentage of unused bytes to used bytes.
    *@example {12.3} PH1
    *@example {12.3} PH2
    */
    sOfFileUnusedSOfFileUsed: '{PH1} % of file unused, {PH2} % of file used',
};
const str_ = i18n.i18n.registerUIStrings('panels/coverage/CoverageListView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export function coverageTypeToString(type) {
    const types = [];
    if (type & 1 /* CSS */) {
        types.push(i18nString(UIStrings.css));
    }
    if (type & 4 /* JavaScriptPerFunction */) {
        types.push(i18nString(UIStrings.jsPerFunction));
    }
    else if (type & 2 /* JavaScript */) {
        types.push(i18nString(UIStrings.jsPerBlock));
    }
    return types.join('+');
}
export class CoverageListView extends UI.Widget.VBox {
    nodeForCoverageInfo;
    isVisibleFilter;
    highlightRegExp;
    dataGrid;
    constructor(isVisibleFilter) {
        super(true);
        this.nodeForCoverageInfo = new Map();
        this.isVisibleFilter = isVisibleFilter;
        this.highlightRegExp = null;
        const columns = [
            { id: 'url', title: i18nString(UIStrings.url), width: '250px', weight: 3, fixedWidth: false, sortable: true },
            { id: 'type', title: i18nString(UIStrings.type), width: '45px', weight: 1, fixedWidth: true, sortable: true },
            {
                id: 'size',
                title: i18nString(UIStrings.totalBytes),
                width: '60px',
                fixedWidth: true,
                sortable: true,
                align: DataGrid.DataGrid.Align.Right,
                weight: 1,
            },
            {
                id: 'unusedSize',
                title: i18nString(UIStrings.unusedBytes),
                width: '100px',
                fixedWidth: true,
                sortable: true,
                align: DataGrid.DataGrid.Align.Right,
                sort: DataGrid.DataGrid.Order.Descending,
                weight: 1,
            },
            {
                id: 'bars',
                title: i18nString(UIStrings.usageVisualization),
                width: '250px',
                fixedWidth: false,
                sortable: true,
                weight: 1,
            },
        ];
        this.dataGrid = new DataGrid.SortableDataGrid.SortableDataGrid({
            displayName: i18nString(UIStrings.codeCoverage),
            columns,
            editCallback: undefined,
            refreshCallback: undefined,
            deleteCallback: undefined,
        });
        this.dataGrid.setResizeMethod(DataGrid.DataGrid.ResizeMethod.Last);
        this.dataGrid.element.classList.add('flex-auto');
        this.dataGrid.element.addEventListener('keydown', this.onKeyDown.bind(this), false);
        this.dataGrid.addEventListener(DataGrid.DataGrid.Events.OpenedNode, this.onOpenedNode, this);
        this.dataGrid.addEventListener(DataGrid.DataGrid.Events.SortingChanged, this.sortingChanged, this);
        const dataGridWidget = this.dataGrid.asWidget();
        dataGridWidget.show(this.contentElement);
        this.setDefaultFocusedChild(dataGridWidget);
    }
    update(coverageInfo) {
        let hadUpdates = false;
        const maxSize = coverageInfo.reduce((acc, entry) => Math.max(acc, entry.size()), 0);
        const rootNode = this.dataGrid.rootNode();
        for (const entry of coverageInfo) {
            let node = this.nodeForCoverageInfo.get(entry);
            if (node) {
                if (this.isVisibleFilter(node.coverageInfo)) {
                    hadUpdates = node.refreshIfNeeded(maxSize) || hadUpdates;
                }
                continue;
            }
            node = new GridNode(entry, maxSize);
            this.nodeForCoverageInfo.set(entry, node);
            if (this.isVisibleFilter(node.coverageInfo)) {
                rootNode.appendChild(node);
                hadUpdates = true;
            }
        }
        if (hadUpdates) {
            this.sortingChanged();
        }
    }
    reset() {
        this.nodeForCoverageInfo.clear();
        this.dataGrid.rootNode().removeChildren();
    }
    updateFilterAndHighlight(highlightRegExp) {
        this.highlightRegExp = highlightRegExp;
        let hadTreeUpdates = false;
        for (const node of this.nodeForCoverageInfo.values()) {
            const shouldBeVisible = this.isVisibleFilter(node.coverageInfo);
            const isVisible = Boolean(node.parent);
            if (shouldBeVisible) {
                node.setHighlight(this.highlightRegExp);
            }
            if (shouldBeVisible === isVisible) {
                continue;
            }
            hadTreeUpdates = true;
            if (!shouldBeVisible) {
                node.remove();
            }
            else {
                this.dataGrid.rootNode().appendChild(node);
            }
        }
        if (hadTreeUpdates) {
            this.sortingChanged();
        }
    }
    selectByUrl(url) {
        for (const [info, node] of this.nodeForCoverageInfo.entries()) {
            if (info.url() === url) {
                node.revealAndSelect();
                break;
            }
        }
    }
    onOpenedNode() {
        this.revealSourceForSelectedNode();
    }
    onKeyDown(event) {
        if (!(event.key === 'Enter')) {
            return;
        }
        event.consume(true);
        this.revealSourceForSelectedNode();
    }
    async revealSourceForSelectedNode() {
        const node = this.dataGrid.selectedNode;
        if (!node) {
            return;
        }
        const coverageInfo = node.coverageInfo;
        let sourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(coverageInfo.url());
        if (!sourceCode) {
            return;
        }
        const formatData = await Formatter.SourceFormatter.SourceFormatter.instance().format(sourceCode);
        sourceCode = formatData.formattedSourceCode;
        if (this.dataGrid.selectedNode !== node) {
            return;
        }
        Common.Revealer.reveal(sourceCode);
    }
    sortingChanged() {
        const columnId = this.dataGrid.sortColumnId();
        if (!columnId) {
            return;
        }
        const sortFunction = GridNode.sortFunctionForColumn(columnId);
        if (!sortFunction) {
            return;
        }
        this.dataGrid.sortNodes(sortFunction, !this.dataGrid.isSortOrderAscending());
    }
    wasShown() {
        super.wasShown();
        this.registerCSSFiles([coverageListViewStyles]);
    }
}
let percentageFormatter = null;
function getPercentageFormatter() {
    if (!percentageFormatter) {
        percentageFormatter = new Intl.NumberFormat(i18n.DevToolsLocale.DevToolsLocale.instance().locale, {
            style: 'percent',
            maximumFractionDigits: 1,
        });
    }
    return percentageFormatter;
}
export class GridNode extends DataGrid.SortableDataGrid.SortableDataGridNode {
    coverageInfo;
    lastUsedSize;
    url;
    maxSize;
    highlightRegExp;
    constructor(coverageInfo, maxSize) {
        super();
        this.coverageInfo = coverageInfo;
        this.url = coverageInfo.url();
        this.maxSize = maxSize;
        this.highlightRegExp = null;
    }
    setHighlight(highlightRegExp) {
        if (this.highlightRegExp === highlightRegExp) {
            return;
        }
        this.highlightRegExp = highlightRegExp;
        this.refresh();
    }
    refreshIfNeeded(maxSize) {
        if (this.lastUsedSize === this.coverageInfo.usedSize() && maxSize === this.maxSize) {
            return false;
        }
        this.lastUsedSize = this.coverageInfo.usedSize();
        this.maxSize = maxSize;
        this.refresh();
        return true;
    }
    createCell(columnId) {
        const cell = this.createTD(columnId);
        switch (columnId) {
            case 'url': {
                UI.Tooltip.Tooltip.install(cell, this.url);
                const outer = cell.createChild('div', 'url-outer');
                const prefix = outer.createChild('div', 'url-prefix');
                const suffix = outer.createChild('div', 'url-suffix');
                const splitURL = /^(.*)(\/[^/]*)$/.exec(this.url);
                prefix.textContent = splitURL ? splitURL[1] : this.url;
                suffix.textContent = splitURL ? splitURL[2] : '';
                if (this.highlightRegExp) {
                    this.highlight(outer, this.url);
                }
                this.setCellAccessibleName(this.url, cell, columnId);
                break;
            }
            case 'type': {
                cell.textContent = coverageTypeToString(this.coverageInfo.type());
                if (this.coverageInfo.type() & 4 /* JavaScriptPerFunction */) {
                    UI.Tooltip.Tooltip.install(cell, i18nString(UIStrings.jsCoverageWithPerFunction));
                }
                else if (this.coverageInfo.type() & 2 /* JavaScript */) {
                    UI.Tooltip.Tooltip.install(cell, i18nString(UIStrings.jsCoverageWithPerBlock));
                }
                break;
            }
            case 'size': {
                const sizeSpan = cell.createChild('span');
                sizeSpan.textContent = Platform.NumberUtilities.withThousandsSeparator(this.coverageInfo.size() || 0);
                const sizeAccessibleName = i18nString(UIStrings.sBytes, { n: this.coverageInfo.size() || 0 });
                this.setCellAccessibleName(sizeAccessibleName, cell, columnId);
                break;
            }
            case 'unusedSize': {
                const unusedSize = this.coverageInfo.unusedSize() || 0;
                const unusedSizeSpan = cell.createChild('span');
                const unusedPercentsSpan = cell.createChild('span', 'percent-value');
                unusedSizeSpan.textContent = Platform.NumberUtilities.withThousandsSeparator(unusedSize);
                const unusedPercentFormatted = getPercentageFormatter().format(this.coverageInfo.unusedPercentage());
                unusedPercentsSpan.textContent = unusedPercentFormatted;
                const unusedAccessibleName = i18nString(UIStrings.sBytesS, { n: unusedSize, percentage: unusedPercentFormatted });
                this.setCellAccessibleName(unusedAccessibleName, cell, columnId);
                break;
            }
            case 'bars': {
                const barContainer = cell.createChild('div', 'bar-container');
                const unusedPercent = getPercentageFormatter().format(this.coverageInfo.unusedPercentage());
                const usedPercent = getPercentageFormatter().format(this.coverageInfo.usedPercentage());
                if (this.coverageInfo.unusedSize() > 0) {
                    const unusedSizeBar = barContainer.createChild('div', 'bar bar-unused-size');
                    unusedSizeBar.style.width = ((this.coverageInfo.unusedSize() / this.maxSize) * 100 || 0) + '%';
                    if (this.coverageInfo.type() & 4 /* JavaScriptPerFunction */) {
                        UI.Tooltip.Tooltip.install(unusedSizeBar, i18nString(UIStrings.sBytesSBelongToFunctionsThatHave, { PH1: this.coverageInfo.unusedSize(), PH2: unusedPercent }));
                    }
                    else if (this.coverageInfo.type() & 2 /* JavaScript */) {
                        UI.Tooltip.Tooltip.install(unusedSizeBar, i18nString(UIStrings.sBytesSBelongToBlocksOf, { PH1: this.coverageInfo.unusedSize(), PH2: unusedPercent }));
                    }
                }
                if (this.coverageInfo.usedSize() > 0) {
                    const usedSizeBar = barContainer.createChild('div', 'bar bar-used-size');
                    usedSizeBar.style.width = ((this.coverageInfo.usedSize() / this.maxSize) * 100 || 0) + '%';
                    if (this.coverageInfo.type() & 4 /* JavaScriptPerFunction */) {
                        UI.Tooltip.Tooltip.install(usedSizeBar, i18nString(UIStrings.sBytesSBelongToFunctionsThatHaveExecuted, { PH1: this.coverageInfo.usedSize(), PH2: usedPercent }));
                    }
                    else if (this.coverageInfo.type() & 2 /* JavaScript */) {
                        UI.Tooltip.Tooltip.install(usedSizeBar, i18nString(UIStrings.sBytesSBelongToBlocksOfJavascript, { PH1: this.coverageInfo.usedSize(), PH2: usedPercent }));
                    }
                }
                this.setCellAccessibleName(i18nString(UIStrings.sOfFileUnusedSOfFileUsed, { PH1: unusedPercent, PH2: usedPercent }), cell, columnId);
            }
        }
        return cell;
    }
    highlight(element, textContent) {
        if (!this.highlightRegExp) {
            return;
        }
        const matches = this.highlightRegExp.exec(textContent);
        if (!matches || !matches.length) {
            return;
        }
        const range = new TextUtils.TextRange.SourceRange(matches.index, matches[0].length);
        UI.UIUtils.highlightRangesWithStyleClass(element, [range], 'filter-highlight');
    }
    static sortFunctionForColumn(columnId) {
        const compareURL = (a, b) => a.url.localeCompare(b.url);
        switch (columnId) {
            case 'url':
                return compareURL;
            case 'type':
                return (a, b) => {
                    const typeA = coverageTypeToString(a.coverageInfo.type());
                    const typeB = coverageTypeToString(b.coverageInfo.type());
                    return typeA.localeCompare(typeB) || compareURL(a, b);
                };
            case 'size':
                return (a, b) => a.coverageInfo.size() - b.coverageInfo.size() || compareURL(a, b);
            case 'bars':
            case 'unusedSize':
                return (a, b) => a.coverageInfo.unusedSize() - b.coverageInfo.unusedSize() || compareURL(a, b);
            default:
                console.assert(false, 'Unknown sort field: ' + columnId);
                return null;
        }
    }
}
//# sourceMappingURL=CoverageListView.js.map