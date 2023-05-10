import * as Common from '../../../../core/common/common.js';
import * as TextUtils from '../../../../models/text_utils/text_utils.js';
import * as UI from '../../legacy.js';
import * as TextEditor from '../text_editor/text_editor.js';
declare const SourcesTextEditor_base: (new (...args: any[]) => {
    "__#8@#events": Common.ObjectWrapper.ObjectWrapper<EventTypes>;
    addEventListener<T extends keyof EventTypes>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T]>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<EventTypes, T>;
    once<T_1 extends keyof EventTypes>(eventType: T_1): Promise<EventTypes[T_1]>;
    removeEventListener<T_2 extends keyof EventTypes>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T_2]>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: keyof EventTypes): boolean;
    dispatchEventToListeners<T_3 extends keyof EventTypes>(eventType: import("../../../../core/platform/typescript-utilities.js").NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<EventTypes, T_3>): void;
}) & typeof TextEditor.CodeMirrorTextEditor.CodeMirrorTextEditor;
export declare class SourcesTextEditor extends SourcesTextEditor_base {
    private readonly delegate;
    private readonly gutterMouseMove;
    private readonly gutterMouseOut;
    private readonly tokenHighlighter;
    private readonly gutters;
    private isHandlingMouseDownEvent;
    private autocompleteConfig;
    private infoBarDiv;
    private selectionBeforeSearch?;
    private executionLine?;
    private executionLineTailMarker?;
    private indentationLevel?;
    private autoAppendedSpaces?;
    constructor(delegate: SourcesTextEditorDelegate, codeMirrorOptions?: UI.TextEditor.Options);
    static getForCodeMirror(codeMirrorEditor: any): SourcesTextEditor;
    attachInfobar(infobar: UI.Infobar.Infobar): void;
    private static guessIndentationLevel;
    isSearchActive(): boolean;
    scrollToLine(lineNumber: number): void;
    highlightSearchResults(regex: RegExp, range: TextUtils.TextRange.TextRange | null): void;
    cancelSearchResultsHighlight(): void;
    removeHighlight(highlightDescriptor: any): void;
    highlightRange(range: TextUtils.TextRange.TextRange, cssClass: string): any;
    installGutter(type: string, leftToNumbers: boolean): void;
    uninstallGutter(type: string): void;
    setGutterDecoration(lineNumber: number, type: string, element: Element | null): void;
    setExecutionLocation(lineNumber: number, columnNumber: number): void;
    showExecutionLineBackground(): void;
    hideExecutionLineBackground(): void;
    clearExecutionLine(): void;
    toggleLineClass(lineNumber: number, className: string, toggled: boolean): void;
    hasLineClass(lineNumber: number, className: string): boolean;
    /**
     * |instance| is actually a CodeMirror.Editor
     */
    private gutterClick;
    private textAreaContextMenu;
    /**
     * |instance| is actually a CodeMirror.Editor
     */
    private gutterContextMenu;
    editRange(range: TextUtils.TextRange.TextRange, text: string, origin?: string): TextUtils.TextRange.TextRange;
    private onUpdateEditorIndentation;
    private setEditorIndentation;
    indent(): string;
    onAutoAppendedSpaces(): void;
    private cursorActivity;
    private reportJump;
    private scroll;
    focusInternal(): void;
    private blurInternal;
    private fireBeforeSelectionChanged;
    dispose(): void;
    setText(text: string): void;
    private updateWhitespace;
    private updateCodeFolding;
    private updateScrollPastEof;
    rewriteMimeType(mimeType: string): string;
    private allWhitespaceOverlayMode;
    private trailingWhitespaceOverlayMode;
    private setupWhitespaceHighlight;
    configureAutocomplete(config: UI.TextEditor.AutocompleteConfig | null): void;
    private updateAutocomplete;
}
export declare enum Events {
    GutterClick = "GutterClick",
    SelectionChanged = "SelectionChanged",
    ScrollChanged = "ScrollChanged",
    EditorFocused = "EditorFocused",
    EditorBlurred = "EditorBlurred",
    JumpHappened = "JumpHappened"
}
export interface JumpHappenedEvent {
    from: TextUtils.TextRange.TextRange | null;
    to: TextUtils.TextRange.TextRange | null;
}
export declare type EventTypes = {
    [Events.GutterClick]: GutterClickEventData;
    [Events.SelectionChanged]: TextUtils.TextRange.TextRange;
    [Events.ScrollChanged]: number;
    [Events.EditorFocused]: void;
    [Events.EditorBlurred]: void;
    [Events.JumpHappened]: JumpHappenedEvent;
};
export declare class SourcesTextEditorDelegate {
    populateLineGutterContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _lineNumber: number): Promise<void>;
    populateTextAreaContextMenu(_contextMenu: UI.ContextMenu.ContextMenu, _lineNumber: number, _columnNumber: number): Promise<void>;
}
export declare const _BlockIndentController: {
    name: string;
    Enter: (codeMirror: any) => any;
    '\'}\'': (codeMirror: any) => any;
};
export declare class TokenHighlighter {
    private readonly textEditor;
    private codeMirror;
    private highlightDescriptor;
    private highlightRegex?;
    private highlightRange?;
    private searchResultMarker?;
    private searchMatchLength?;
    constructor(textEditor: SourcesTextEditor, codeMirror: any);
    highlightSearchResults(regex: RegExp, range: TextUtils.TextRange.TextRange | null): void;
    highlightedRegex(): RegExp | undefined;
    highlightSelectedTokens(): void;
    private isWord;
    private removeHighlight;
    private searchHighlighter;
    private tokenHighlighter;
    private setHighlighter;
}
export declare const lineNumbersGutterType = "CodeMirror-linenumbers";
export interface GutterClickEventData {
    gutterType: string;
    lineNumber: number;
    event: MouseEvent;
}
export {};
