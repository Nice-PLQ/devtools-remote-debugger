import * as Common from '../../../../core/common/common.js';
import * as TextUtils from '../../../../models/text_utils/text_utils.js';
import type * as Workspace from '../../../../models/workspace/workspace.js';
import * as UI from '../../legacy.js';
import type { SourcesTextEditorDelegate } from './SourcesTextEditor.js';
import { SourcesTextEditor } from './SourcesTextEditor.js';
export declare class SourceFrameImpl extends UI.View.SimpleView implements UI.SearchableView.Searchable, UI.SearchableView.Replaceable, SourcesTextEditorDelegate, Transformer {
    private readonly lazyContent;
    private prettyInternal;
    private rawContent;
    private formattedContentPromise;
    private formattedMap;
    private readonly prettyToggle;
    private shouldAutoPrettyPrint;
    private readonly progressToolbarItem;
    private textEditorInternal;
    private prettyCleanGeneration;
    private cleanGeneration;
    private searchConfig;
    private delayedFindSearchMatches;
    private currentSearchResultIndex;
    private searchResults;
    private searchRegex;
    private loadError;
    private muteChangeEventsForSetContent;
    private readonly sourcePosition;
    private searchableView;
    private editable;
    private positionToReveal;
    private lineToScrollTo;
    private selectionToSet;
    private loadedInternal;
    private contentRequested;
    private highlighterTypeInternal;
    private wasmDisassemblyInternal;
    contentSet: boolean;
    constructor(lazyContent: () => Promise<TextUtils.ContentProvider.DeferredContent>, codeMirrorOptions?: UI.TextEditor.Options);
    get wasmDisassembly(): Common.WasmDisassembly.WasmDisassembly | null;
    editorLocationToUILocation(lineNumber: number, columnNumber?: number): {
        lineNumber: number;
        columnNumber?: number | undefined;
    };
    uiLocationToEditorLocation(lineNumber: number, columnNumber?: number | undefined): {
        lineNumber: number;
        columnNumber: number;
    };
    setCanPrettyPrint(canPrettyPrint: boolean, autoPrettyPrint?: boolean): void;
    private setPretty;
    private updateLineNumberFormatter;
    private updatePrettyPrintState;
    private prettyToRawLocation;
    private rawToPrettyLocation;
    setEditable(editable: boolean): void;
    hasLoadError(): boolean;
    wasShown(): void;
    willHide(): void;
    toolbarItems(): Promise<UI.Toolbar.ToolbarItem[]>;
    get loaded(): boolean;
    get textEditor(): SourcesTextEditor;
    get pretty(): boolean;
    private ensureContentLoaded;
    private requestFormattedContent;
    revealPosition(line: number, column?: number, shouldHighlight?: boolean): void;
    private innerRevealPositionIfNeeded;
    private clearPositionToReveal;
    scrollToLine(line: number): void;
    private innerScrollToLineIfNeeded;
    selection(): TextUtils.TextRange.TextRange;
    setSelection(textRange: TextUtils.TextRange.TextRange): void;
    private innerSetSelectionIfNeeded;
    private wasShownOrLoaded;
    onTextChanged(_oldRange: TextUtils.TextRange.TextRange, _newRange: TextUtils.TextRange.TextRange): void;
    isClean(): boolean;
    contentCommitted(): void;
    private simplifyMimeType;
    setHighlighterType(highlighterType: string): void;
    highlighterType(): string;
    private updateHighlighterType;
    setContent(content: string | null, loadError: string | null): void;
    setSearchableView(view: UI.SearchableView.SearchableView | null): void;
    private doFindSearchMatches;
    performSearch(searchConfig: UI.SearchableView.SearchConfig, shouldJump: boolean, jumpBackwards?: boolean): void;
    private resetCurrentSearchResultIndex;
    private resetSearch;
    searchCanceled(): void;
    jumpToLastSearchResult(): void;
    private searchResultIndexForCurrentSelection;
    jumpToNextSearchResult(): void;
    jumpToPreviousSearchResult(): void;
    supportsCaseSensitiveSearch(): boolean;
    supportsRegexSearch(): boolean;
    jumpToSearchResult(index: number): void;
    replaceSelectionWith(searchConfig: UI.SearchableView.SearchConfig, replacement: string): void;
    replaceAllWith(searchConfig: UI.SearchableView.SearchConfig, replacement: string): void;
    private collectRegexMatches;
    populateLineGutterContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _editorLineNumber: number): Promise<void>;
    populateTextAreaContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _editorLineNumber: number, _editorColumnNumber: number): Promise<void>;
    canEditSource(): boolean;
    private updateSourcePosition;
}
export interface LineDecorator {
    decorate(uiSourceCode: Workspace.UISourceCode.UISourceCode, textEditor: SourcesTextEditor, type: string): void;
}
export interface Transformer {
    editorLocationToUILocation(lineNumber: number, columnNumber?: number): {
        lineNumber: number;
        columnNumber?: number | undefined;
    };
    uiLocationToEditorLocation(lineNumber: number, columnNumber?: number): {
        lineNumber: number;
        columnNumber: number;
    };
}
export declare function registerLineDecorator(registration: LineDecoratorRegistration): void;
export declare function getRegisteredLineDecorators(): LineDecoratorRegistration[];
export declare enum DecoratorType {
    PERFORMANCE = "performance",
    MEMORY = "memory",
    COVERAGE = "coverage"
}
export interface LineDecoratorRegistration {
    lineDecorator: () => LineDecorator;
    decoratorType: DecoratorType;
}
