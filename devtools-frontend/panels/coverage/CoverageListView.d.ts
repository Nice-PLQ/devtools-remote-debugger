import * as DataGrid from '../../ui/legacy/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';
import type { URLCoverageInfo } from './CoverageModel.js';
import { CoverageType } from './CoverageModel.js';
export declare function coverageTypeToString(type: CoverageType): string;
export declare class CoverageListView extends UI.Widget.VBox {
    private readonly nodeForCoverageInfo;
    private readonly isVisibleFilter;
    private highlightRegExp;
    private dataGrid;
    constructor(isVisibleFilter: (arg0: URLCoverageInfo) => boolean);
    update(coverageInfo: URLCoverageInfo[]): void;
    reset(): void;
    updateFilterAndHighlight(highlightRegExp: RegExp | null): void;
    selectByUrl(url: string): void;
    private onOpenedNode;
    private onKeyDown;
    private revealSourceForSelectedNode;
    private sortingChanged;
    wasShown(): void;
}
export declare class GridNode extends DataGrid.SortableDataGrid.SortableDataGridNode<GridNode> {
    coverageInfo: URLCoverageInfo;
    private lastUsedSize;
    private url;
    private maxSize;
    private highlightRegExp;
    constructor(coverageInfo: URLCoverageInfo, maxSize: number);
    setHighlight(highlightRegExp: RegExp | null): void;
    refreshIfNeeded(maxSize: number): boolean;
    createCell(columnId: string): HTMLElement;
    private highlight;
    static sortFunctionForColumn(columnId: string): ((arg0: GridNode, arg1: GridNode) => number) | null;
}
