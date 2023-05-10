import * as Common from '../../../../core/common/common.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as TextUtils from '../../../../models/text_utils/text_utils.js';
import * as UI from '../../legacy.js';
import { TextEditorAutocompleteController } from './TextEditorAutocompleteController.js';
export interface Token {
    startColumn: number;
    endColumn: number;
    type: string;
}
export interface Coordinates {
    x: number;
    y: number;
    height: number;
}
declare const CodeMirrorTextEditor_base: (new (...args: any[]) => {
    "__#8@#events": Common.ObjectWrapper.ObjectWrapper<UI.TextEditor.EventTypes>;
    addEventListener<T extends keyof UI.TextEditor.EventTypes>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<UI.TextEditor.EventTypes[T]>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<UI.TextEditor.EventTypes, T>;
    once<T_1 extends keyof UI.TextEditor.EventTypes>(eventType: T_1): Promise<UI.TextEditor.EventTypes[T_1]>;
    removeEventListener<T_2 extends keyof UI.TextEditor.EventTypes>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<UI.TextEditor.EventTypes[T_2]>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: keyof UI.TextEditor.EventTypes): boolean;
    dispatchEventToListeners<T_3 extends keyof UI.TextEditor.EventTypes>(eventType: Platform.TypeScriptUtilities.NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<UI.TextEditor.EventTypes, T_3>): void;
}) & typeof UI.Widget.VBox;
export declare class CodeMirrorTextEditor extends CodeMirrorTextEditor_base implements UI.TextEditor.TextEditor {
    private options;
    private codeMirrorInternal;
    private readonly codeMirrorElement;
    private shouldClearHistory;
    private lineSeparator;
    private hasOneLine;
    private readonly bookmarkForMarker;
    private readonly selectNextOccurrenceController;
    private readonly decorations;
    private needsRefresh;
    private readOnlyInternal;
    private mimeTypeInternal;
    private placeholderElement;
    autocompleteController?: TextEditorAutocompleteController;
    private highlightedLine?;
    private clearHighlightTimeout?;
    private editorSizeInSync?;
    private lastSelectionInternal?;
    private selectionSetScheduled?;
    constructor(options: UI.TextEditor.Options);
    static getForCodeMirror(codeMirrorEditor: any): CodeMirrorTextEditor;
    static autocompleteCommand(codeMirror: any): void;
    static undoLastSelectionCommand(codeMirror: any): void;
    static selectNextOccurrenceCommand(codeMirror: any): void;
    static moveCamelLeftCommand(shift: boolean, codeMirror: any): void;
    static moveCamelRightCommand(shift: boolean, codeMirror: any): void;
    private static getIndentation;
    static overrideModeWithPrefixedTokens(modeName: string, tokenPrefix: string): void;
    private static fixWordMovement;
    codeMirror(): any;
    widget(): UI.Widget.Widget;
    setPlaceholder(placeholder: string): void;
    private normalizePositionForOverlappingColumn;
    private camelCaseMoveFromPosition;
    private doCamelCaseMovement;
    dispose(): void;
    private enableBracketMatchingIfNeeded;
    wasShown(): void;
    protected refresh(): void;
    willHide(): void;
    undo(): void;
    redo(): void;
    private handleKeyDown;
    private handlePostKeyDown;
    configureAutocomplete(config: UI.TextEditor.AutocompleteConfig | null): void;
    cursorPositionToCoordinates(lineNumber: number, column: number): Coordinates | null;
    coordinatesToCursorPosition(x: number, y: number): TextUtils.TextRange.TextRange | null;
    visualCoordinates(lineNumber: number, columnNumber: number): {
        x: number;
        y: number;
    };
    tokenAtTextPosition(lineNumber: number, columnNumber: number): Token | null;
    isClean(generation: number): boolean;
    markClean(): number;
    private hasLongLines;
    private enableLongLinesMode;
    private disableLongLinesMode;
    private updateIndentSize;
    setMimeType(mimeType: string): void;
    setHighlightMode(mode: Object): void;
    protected rewriteMimeType(mimeType: string): string;
    protected mimeType(): string;
    setReadOnly(readOnly: boolean): void;
    readOnly(): boolean;
    setLineNumberFormatter(formatter: (arg0: number) => string): void;
    addKeyDownHandler(handler: (arg0: KeyboardEvent) => void): void;
    addBookmark(lineNumber: number, columnNumber: number, element: HTMLElement, type: symbol, insertBefore?: boolean): TextEditorBookMark;
    bookmarks(range: TextUtils.TextRange.TextRange, type?: symbol): TextEditorBookMark[];
    focus(): void;
    hasFocus(): boolean;
    operation(operation: () => any): void;
    scrollLineIntoView(lineNumber: number): void;
    innerRevealLine(lineNumber: number, scrollInfo: {
        left: number;
        top: number;
        width: number;
        height: number;
        clientWidth: number;
        clientHeight: number;
    }): void;
    addDecoration(element: HTMLElement, lineNumber: number, startColumn?: number, endColumn?: number): void;
    private updateFloatingDecoration;
    updateDecorations(lineNumber: number): void;
    removeDecoration(element: Element, lineNumber: number): void;
    revealPosition(lineNumber: number, columnNumber?: number, shouldHighlight?: boolean): void;
    clearPositionHighlight(): void;
    elementsToRestoreScrollPositionsFor(): Element[];
    private updatePaddingBottom;
    toggleScrollPastEof(enableScrolling: boolean): void;
    private resizeEditor;
    onResize(): void;
    editRange(range: TextUtils.TextRange.TextRange, text: string, origin?: string): TextUtils.TextRange.TextRange;
    clearAutocomplete(): void;
    wordRangeForCursorPosition(lineNumber: number, column: number, isWordChar: (arg0: string) => boolean): TextUtils.TextRange.TextRange;
    private changes;
    private beforeSelectionChange;
    scrollToLine(lineNumber: number): void;
    firstVisibleLine(): number;
    scrollTop(): number;
    setScrollTop(scrollTop: number): void;
    lastVisibleLine(): number;
    selection(): TextUtils.TextRange.TextRange;
    selections(): TextUtils.TextRange.TextRange[];
    lastSelection(): TextUtils.TextRange.TextRange | null;
    setSelection(textRange: TextUtils.TextRange.TextRange, dontScroll?: boolean): void;
    setSelections(ranges: TextUtils.TextRange.TextRange[], primarySelectionIndex?: number): void;
    private detectLineSeparator;
    setText(text: string): void;
    text(textRange?: TextUtils.TextRange.TextRange): string;
    textWithCurrentSuggestion(): string;
    fullRange(): TextUtils.TextRange.TextRange;
    currentLineNumber(): number;
    line(lineNumber: number): string;
    get linesCount(): number;
    newlineAndIndent(): void;
    textEditorPositionHandle(lineNumber: number, columnNumber: number): TextEditorPositionHandle;
    private updatePlaceholder;
    static readonly maxHighlightLength = 1000;
    static readonly LongLineModeLineLengthThreshold = 2000;
    static readonly MaxEditableTextSize: number;
}
export declare class CodeMirrorPositionHandle implements TextEditorPositionHandle {
    private readonly codeMirror;
    private readonly lineHandle;
    private readonly columnNumber;
    constructor(codeMirror: any, pos: any);
    resolve(): {
        lineNumber: number;
        columnNumber: number;
    } | null;
    equal(argPositionHandle: TextEditorPositionHandle): boolean;
}
export declare class SelectNextOccurrenceController {
    private readonly textEditor;
    private readonly codeMirror;
    private muteSelectionListener?;
    private fullWordSelection?;
    constructor(textEditor: CodeMirrorTextEditor, codeMirror: any);
    selectionWillChange(): void;
    private findRange;
    undoLastSelection(): void;
    selectNextOccurrence(): void;
    private expandSelectionsToWords;
    private findNextOccurrence;
}
/**
 * @interface
 */
export interface TextEditorPositionHandle {
    resolve(): {
        lineNumber: number;
        columnNumber: number;
    } | null;
    equal(positionHandle: TextEditorPositionHandle): boolean;
}
export declare class TextEditorBookMark {
    private readonly marker;
    private readonly typeInternal;
    private readonly editor;
    constructor(marker: any, type: symbol, editor: CodeMirrorTextEditor);
    clear(): void;
    refresh(): void;
    type(): symbol;
    position(): TextUtils.TextRange.TextRange | null;
}
export declare class CodeMirrorTextEditorFactory implements UI.TextEditor.TextEditorFactory {
    static instance(opts?: {
        forceNew: boolean | null;
    }): CodeMirrorTextEditorFactory;
    createEditor(options: UI.TextEditor.Options): CodeMirrorTextEditor;
}
export declare class DevToolsAccessibleTextArea extends CodeMirror.inputStyles.textarea {
    textarea: HTMLTextAreaElement;
    contextMenuPending: boolean;
    composing: boolean;
    cm: any;
    prevInput: string;
    constructor(codeMirror: any);
    init(display: Object): void;
    private onCompositionStart;
    reset(typing?: boolean): void;
    /**
     * If the user is currently typing into the textarea or otherwise
     * modifying it, we don't want to clobber their work.
     */
    protected textAreaBusy(typing: boolean): boolean;
    poll(): boolean;
}
export interface Decoration {
    element: Element;
    widget: any;
    update: (() => void) | null;
}
export {};
