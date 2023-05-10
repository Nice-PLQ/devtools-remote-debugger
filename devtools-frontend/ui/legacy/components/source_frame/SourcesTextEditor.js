// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../../core/common/common.js';
import * as TextUtils from '../../../../models/text_utils/text_utils.js';
import * as UI from '../../legacy.js';
import * as TextEditor from '../text_editor/text_editor.js';
const whitespaceStyleInjectedSet = new WeakSet();
export class SourcesTextEditor extends Common.ObjectWrapper.eventMixin(TextEditor.CodeMirrorTextEditor.CodeMirrorTextEditor) {
    delegate;
    gutterMouseMove;
    gutterMouseOut;
    tokenHighlighter;
    gutters;
    isHandlingMouseDownEvent;
    autocompleteConfig;
    infoBarDiv;
    selectionBeforeSearch;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executionLine;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executionLineTailMarker;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    indentationLevel;
    autoAppendedSpaces;
    constructor(delegate, codeMirrorOptions) {
        const defaultCodeMirrorOptions = {
            lineNumbers: true,
            lineWrapping: false,
            bracketMatchingSetting: Common.Settings.Settings.instance().moduleSetting('textEditorBracketMatching'),
            padBottom: Common.Settings.Settings.instance().moduleSetting('allowScrollPastEof').get(),
            lineWiseCopyCut: true,
            devtoolsAccessibleName: undefined,
            mimeType: undefined,
            autoHeight: undefined,
            maxHighlightLength: undefined,
            placeholder: undefined,
            inputStyle: undefined,
        };
        if (codeMirrorOptions) {
            Object.assign(defaultCodeMirrorOptions, codeMirrorOptions);
        }
        super(defaultCodeMirrorOptions);
        this.codeMirror().addKeyMap({ 'Enter': 'smartNewlineAndIndent', 'Esc': 'sourcesDismiss' });
        this.delegate = delegate;
        this.codeMirror().on('cursorActivity', this.cursorActivity.bind(this));
        this.codeMirror().on('gutterClick', this.gutterClick.bind(this));
        this.codeMirror().on('scroll', this.scroll.bind(this));
        this.codeMirror().on('focus', this.focusInternal.bind(this));
        this.codeMirror().on('blur', this.blurInternal.bind(this));
        this.codeMirror().on('beforeSelectionChange', this.fireBeforeSelectionChanged.bind(this));
        this.codeMirror().on('gutterContextMenu', this.gutterContextMenu.bind(this));
        this.element.addEventListener('contextmenu', this.textAreaContextMenu.bind(this), false);
        this.gutterMouseMove = (event) => {
            const mouseEvent = event;
            this.element.classList.toggle('CodeMirror-gutter-hovered', mouseEvent.clientX < this.codeMirror().getGutterElement().getBoundingClientRect().right);
        };
        this.gutterMouseOut = () => {
            this.element.classList.toggle('CodeMirror-gutter-hovered', false);
        };
        this.codeMirror().addKeyMap(_BlockIndentController);
        // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.tokenHighlighter = new TokenHighlighter(this, this.codeMirror());
        this.gutters = [lineNumbersGutterType];
        this.codeMirror().setOption('gutters', this.gutters.slice());
        this.codeMirror().setOption('electricChars', false);
        this.codeMirror().setOption('smartIndent', false);
        this.isHandlingMouseDownEvent = false;
        function updateAnticipateJumpFlag(value) {
            this.isHandlingMouseDownEvent = value;
        }
        this.element.addEventListener('mousedown', updateAnticipateJumpFlag.bind(this, true), true);
        this.element.addEventListener('mousedown', updateAnticipateJumpFlag.bind(this, false), false);
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorIndent')
            .addChangeListener(this.onUpdateEditorIndentation, this);
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorAutoDetectIndent')
            .addChangeListener(this.onUpdateEditorIndentation, this);
        Common.Settings.Settings.instance()
            .moduleSetting('showWhitespacesInEditor')
            .addChangeListener(this.updateWhitespace, this);
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorCodeFolding')
            .addChangeListener(this.updateCodeFolding, this);
        Common.Settings.Settings.instance()
            .moduleSetting('allowScrollPastEof')
            .addChangeListener(this.updateScrollPastEof, this);
        this.updateCodeFolding();
        this.autocompleteConfig = {
            isWordChar: TextUtils.TextUtils.Utils.isWordChar,
            substituteRangeCallback: undefined,
            tooltipCallback: undefined,
            suggestionsCallback: undefined,
            anchorBehavior: undefined,
        };
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorAutocompletion')
            .addChangeListener(this.updateAutocomplete, this);
        this.updateAutocomplete();
        this.onUpdateEditorIndentation();
        this.setupWhitespaceHighlight();
        this.infoBarDiv = null;
    }
    // https://crbug.com/1151919 * = CodeMirror.Editor
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static getForCodeMirror(codeMirrorEditor) {
        return TextEditor.CodeMirrorTextEditor.CodeMirrorTextEditor.getForCodeMirror(codeMirrorEditor);
    }
    attachInfobar(infobar) {
        if (!this.infoBarDiv) {
            this.infoBarDiv = document.createElement('div');
            this.infoBarDiv.classList.add('flex-none');
            this.element.insertBefore(this.infoBarDiv, this.element.firstChild);
        }
        this.infoBarDiv.appendChild(infobar.element);
        infobar.setParentView(this);
        this.doResize();
    }
    static guessIndentationLevel(lines) {
        const tabRegex = /^\t+/;
        let tabLines = 0;
        /**
         * Maps the indentation level to its frequency in |lines|.
         */
        const indents = new Map();
        for (let lineNumber = 0; lineNumber < lines.length; ++lineNumber) {
            const text = lines[lineNumber];
            if (text.length === 0 || !TextUtils.TextUtils.Utils.isSpaceChar(text[0])) {
                continue;
            }
            if (tabRegex.test(text)) {
                ++tabLines;
                continue;
            }
            let i = 0;
            while (i < text.length && TextUtils.TextUtils.Utils.isSpaceChar(text[i])) {
                ++i;
            }
            if (i % 2 !== 0) {
                continue;
            }
            indents.set(i, 1 + (indents.get(i) || 0));
        }
        const linesCountPerIndentThreshold = 3 * lines.length / 100;
        if (tabLines && tabLines > linesCountPerIndentThreshold) {
            return '\t';
        }
        let minimumIndent = Infinity;
        for (const [indent, frequency] of indents) {
            if (frequency < linesCountPerIndentThreshold) {
                continue;
            }
            if (minimumIndent > indent) {
                minimumIndent = indent;
            }
        }
        if (minimumIndent === Infinity) {
            return Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
        }
        return ' '.repeat(minimumIndent);
    }
    isSearchActive() {
        return Boolean(this.tokenHighlighter.highlightedRegex());
    }
    scrollToLine(lineNumber) {
        super.scrollToLine(lineNumber);
        this.scroll();
    }
    highlightSearchResults(regex, range) {
        function innerHighlightRegex() {
            if (range) {
                this.scrollLineIntoView(range.startLine);
                if (range.endColumn > TextEditor.CodeMirrorTextEditor.CodeMirrorTextEditor.maxHighlightLength) {
                    this.setSelection(range);
                }
                else {
                    this.setSelection(TextUtils.TextRange.TextRange.createFromLocation(range.startLine, range.startColumn));
                }
            }
            this.tokenHighlighter.highlightSearchResults(regex, range);
        }
        if (!this.selectionBeforeSearch) {
            this.selectionBeforeSearch = this.selection();
        }
        this.codeMirror().operation(innerHighlightRegex.bind(this));
    }
    cancelSearchResultsHighlight() {
        this.codeMirror().operation(this.tokenHighlighter.highlightSelectedTokens.bind(this.tokenHighlighter));
        if (this.selectionBeforeSearch) {
            this.reportJump(this.selectionBeforeSearch, this.selection());
            delete this.selectionBeforeSearch;
        }
    }
    // https://crbug.com/1151919 * = CodeMirror.TextMarker
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeHighlight(highlightDescriptor) {
        highlightDescriptor.clear();
    }
    // https://crbug.com/1151919 * = CodeMirror.TextMarker<CodeMirror.MarkerRange>
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    highlightRange(range, cssClass) {
        cssClass = 'CodeMirror-persist-highlight ' + cssClass;
        const pos = TextUtils.CodeMirrorUtils.toPos(range);
        ++pos.end.ch;
        return this.codeMirror().markText(pos.start, pos.end, { className: cssClass, startStyle: cssClass + '-start', endStyle: cssClass + '-end' });
    }
    installGutter(type, leftToNumbers) {
        if (this.gutters.indexOf(type) !== -1) {
            return;
        }
        if (leftToNumbers) {
            this.gutters.unshift(type);
        }
        else {
            this.gutters.push(type);
        }
        this.codeMirror().setOption('gutters', this.gutters.slice());
        this.refresh();
    }
    uninstallGutter(type) {
        const index = this.gutters.indexOf(type);
        if (index === -1) {
            return;
        }
        this.codeMirror().clearGutter(type);
        this.gutters.splice(index, 1);
        this.codeMirror().setOption('gutters', this.gutters.slice());
        this.refresh();
    }
    setGutterDecoration(lineNumber, type, element) {
        console.assert(this.gutters.indexOf(type) !== -1, 'Cannot decorate unexisting gutter.');
        this.codeMirror().setGutterMarker(lineNumber, type, element);
    }
    setExecutionLocation(lineNumber, columnNumber) {
        this.clearPositionHighlight();
        this.executionLine = this.codeMirror().getLineHandle(lineNumber);
        if (!this.executionLine) {
            return;
        }
        this.showExecutionLineBackground();
        this.codeMirror().addLineClass(this.executionLine, 'wrap', 'cm-execution-line-outline');
        let token = this.tokenAtTextPosition(lineNumber, columnNumber);
        if (token && !token.type && token.startColumn + 1 === token.endColumn) {
            const tokenContent = this.codeMirror().getLine(lineNumber)[token.startColumn];
            if (tokenContent === '.' || tokenContent === '(') {
                token = this.tokenAtTextPosition(lineNumber, token.endColumn + 1);
            }
        }
        let endColumn;
        if (token && token.type) {
            endColumn = token.endColumn;
        }
        else {
            endColumn = this.codeMirror().getLine(lineNumber).length;
        }
        this.executionLineTailMarker = this.codeMirror().markText({ line: lineNumber, ch: columnNumber }, { line: lineNumber, ch: endColumn }, { className: 'cm-execution-line-tail' });
    }
    showExecutionLineBackground() {
        if (this.executionLine) {
            this.codeMirror().addLineClass(this.executionLine, 'wrap', 'cm-execution-line');
        }
    }
    hideExecutionLineBackground() {
        if (this.executionLine) {
            this.codeMirror().removeLineClass(this.executionLine, 'wrap', 'cm-execution-line');
        }
    }
    clearExecutionLine() {
        this.clearPositionHighlight();
        if (this.executionLine) {
            this.hideExecutionLineBackground();
            this.codeMirror().removeLineClass(this.executionLine, 'wrap', 'cm-execution-line-outline');
        }
        delete this.executionLine;
        if (this.executionLineTailMarker) {
            this.executionLineTailMarker.clear();
        }
        delete this.executionLineTailMarker;
    }
    toggleLineClass(lineNumber, className, toggled) {
        if (this.hasLineClass(lineNumber, className) === toggled) {
            return;
        }
        const lineHandle = this.codeMirror().getLineHandle(lineNumber);
        if (!lineHandle) {
            return;
        }
        if (toggled) {
            this.codeMirror().addLineClass(lineHandle, 'gutter', className);
            this.codeMirror().addLineClass(lineHandle, 'wrap', className);
        }
        else {
            this.codeMirror().removeLineClass(lineHandle, 'gutter', className);
            this.codeMirror().removeLineClass(lineHandle, 'wrap', className);
        }
    }
    hasLineClass(lineNumber, className) {
        const lineInfo = this.codeMirror().lineInfo(lineNumber);
        if (!lineInfo) {
            return false;
        }
        const wrapClass = lineInfo.wrapClass;
        if (!wrapClass) {
            return false;
        }
        const classNames = wrapClass.split(' ');
        return classNames.indexOf(className) !== -1;
    }
    /**
     * |instance| is actually a CodeMirror.Editor
     */
    gutterClick(_instance, lineNumber, gutterType, event) {
        this.dispatchEventToListeners(Events.GutterClick, { gutterType, lineNumber, event });
    }
    textAreaContextMenu(event) {
        const contextMenu = new UI.ContextMenu.ContextMenu(event);
        event.consume(true); // Consume event now to prevent document from handling the async menu
        const textSelection = this.selection();
        this.delegate.populateTextAreaContextMenu(contextMenu, textSelection.startLine, textSelection.startColumn)
            .then(() => {
            contextMenu.appendApplicableItems(this);
            contextMenu.show();
        });
    }
    /**
     * |instance| is actually a CodeMirror.Editor
     */
    gutterContextMenu(_instance, lineNumber, _gutterType, event) {
        const contextMenu = new UI.ContextMenu.ContextMenu(event);
        event.consume(true); // Consume event now to prevent document from handling the async menu
        this.delegate.populateLineGutterContextMenu(contextMenu, lineNumber).then(() => {
            contextMenu.appendApplicableItems(this);
            contextMenu.show();
        });
    }
    editRange(range, text, origin) {
        const newRange = super.editRange(range, text, origin);
        if (Common.Settings.Settings.instance().moduleSetting('textEditorAutoDetectIndent').get()) {
            this.onUpdateEditorIndentation();
        }
        return newRange;
    }
    onUpdateEditorIndentation() {
        this.setEditorIndentation(TextUtils.CodeMirrorUtils.pullLines(this.codeMirror(), LinesToScanForIndentationGuessing));
    }
    setEditorIndentation(lines) {
        const extraKeys = {};
        let indent = Common.Settings.Settings.instance().moduleSetting('textEditorIndent').get();
        if (Common.Settings.Settings.instance().moduleSetting('textEditorAutoDetectIndent').get()) {
            indent = SourcesTextEditor.guessIndentationLevel(lines);
        }
        if (indent === '\t') {
            this.codeMirror().setOption('indentWithTabs', true);
            this.codeMirror().setOption('indentUnit', 4);
        }
        else {
            this.codeMirror().setOption('indentWithTabs', false);
            this.codeMirror().setOption('indentUnit', indent.length);
            /**
             * TODO: |codeMirror| is really a CodeMirror.Editor
             */
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function tab(codeMirror) {
                if (codeMirror.somethingSelected()) {
                    return CodeMirror.Pass;
                }
                const pos = codeMirror.getCursor('head');
                codeMirror.replaceRange(indent.substring(pos.ch % indent.length), codeMirror.getCursor());
            }
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
            // @ts-expect-error
            extraKeys.Tab = tab;
        }
        this.codeMirror().setOption('extraKeys', extraKeys);
        this.indentationLevel = indent;
    }
    indent() {
        return this.indentationLevel;
    }
    onAutoAppendedSpaces() {
        this.autoAppendedSpaces = this.autoAppendedSpaces || [];
        for (let i = 0; i < this.autoAppendedSpaces.length; ++i) {
            const position = this.autoAppendedSpaces[i].resolve();
            if (!position) {
                continue;
            }
            const line = this.line(position.lineNumber);
            if (line.length === position.columnNumber && TextUtils.TextUtils.Utils.lineIndent(line).length === line.length) {
                this.codeMirror().replaceRange('', new CodeMirror.Pos(position.lineNumber, 0), new CodeMirror.Pos(position.lineNumber, position.columnNumber));
            }
        }
        this.autoAppendedSpaces = [];
        const selections = this.selections();
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            this.autoAppendedSpaces.push(this.textEditorPositionHandle(selection.startLine, selection.startColumn));
        }
    }
    cursorActivity() {
        if (!this.isSearchActive()) {
            this.codeMirror().operation(this.tokenHighlighter.highlightSelectedTokens.bind(this.tokenHighlighter));
        }
        const start = this.codeMirror().getCursor('anchor');
        const end = this.codeMirror().getCursor('head');
        this.dispatchEventToListeners(Events.SelectionChanged, TextUtils.CodeMirrorUtils.toRange(start, end));
    }
    reportJump(from, to) {
        if (from && to && from.equal(to)) {
            return;
        }
        this.dispatchEventToListeners(Events.JumpHappened, { from, to });
    }
    scroll() {
        const topmostLineNumber = this.codeMirror().lineAtHeight(this.codeMirror().getScrollInfo().top, 'local');
        this.dispatchEventToListeners(Events.ScrollChanged, topmostLineNumber);
    }
    focusInternal() {
        this.dispatchEventToListeners(Events.EditorFocused);
    }
    blurInternal() {
        this.dispatchEventToListeners(Events.EditorBlurred);
    }
    // https://crbug.com/1151919 * = {ranges: !Array.<{head: !CodeMirror.Pos, anchor: !CodeMirror.Pos}>}
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fireBeforeSelectionChanged(_codeMirror, selection) {
        if (!this.isHandlingMouseDownEvent) {
            return;
        }
        if (!selection.ranges.length) {
            return;
        }
        const primarySelection = selection.ranges[0];
        this.reportJump(this.selection(), TextUtils.CodeMirrorUtils.toRange(primarySelection.anchor, primarySelection.head));
    }
    dispose() {
        super.dispose();
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorIndent')
            .removeChangeListener(this.onUpdateEditorIndentation, this);
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorAutoDetectIndent')
            .removeChangeListener(this.onUpdateEditorIndentation, this);
        Common.Settings.Settings.instance()
            .moduleSetting('showWhitespacesInEditor')
            .removeChangeListener(this.updateWhitespace, this);
        Common.Settings.Settings.instance()
            .moduleSetting('textEditorCodeFolding')
            .removeChangeListener(this.updateCodeFolding, this);
        Common.Settings.Settings.instance()
            .moduleSetting('allowScrollPastEof')
            .removeChangeListener(this.updateScrollPastEof, this);
    }
    setText(text) {
        this.setEditorIndentation(text.split('\n').slice(0, LinesToScanForIndentationGuessing));
        super.setText(text);
    }
    updateWhitespace() {
        this.setMimeType(this.mimeType());
    }
    updateCodeFolding() {
        if (Common.Settings.Settings.instance().moduleSetting('textEditorCodeFolding').get()) {
            this.installGutter('CodeMirror-foldgutter', false);
            this.element.addEventListener('mousemove', this.gutterMouseMove);
            this.element.addEventListener('mouseout', this.gutterMouseOut);
            this.codeMirror().setOption('foldGutter', true);
            this.codeMirror().setOption('foldOptions', { minFoldSize: 1 });
        }
        else {
            this.codeMirror().execCommand('unfoldAll');
            this.element.removeEventListener('mousemove', this.gutterMouseMove);
            this.element.removeEventListener('mouseout', this.gutterMouseOut);
            this.uninstallGutter('CodeMirror-foldgutter');
            this.codeMirror().setOption('foldGutter', false);
        }
    }
    updateScrollPastEof() {
        this.toggleScrollPastEof(Common.Settings.Settings.instance().moduleSetting('allowScrollPastEof').get());
    }
    rewriteMimeType(mimeType) {
        this.setupWhitespaceHighlight();
        const whitespaceMode = Common.Settings.Settings.instance().moduleSetting('showWhitespacesInEditor').get();
        this.element.classList.toggle('show-whitespaces', whitespaceMode === 'all');
        if (whitespaceMode === 'all') {
            return this.allWhitespaceOverlayMode(mimeType);
        }
        if (whitespaceMode === 'trailing') {
            return this.trailingWhitespaceOverlayMode(mimeType);
        }
        return mimeType;
    }
    allWhitespaceOverlayMode(mimeType) {
        let modeName = CodeMirror.mimeModes[mimeType] ?
            (CodeMirror.mimeModes[mimeType].name || CodeMirror.mimeModes[mimeType]) :
            CodeMirror.mimeModes['text/plain'];
        modeName += '+all-whitespaces';
        if (CodeMirror.modes[modeName]) {
            return modeName;
        }
        /**
         * TODO: |config| is really a CodeMirror.EditorConfiguration
         */
        // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function modeConstructor(config, _parserConfig) {
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function nextToken(stream) {
                if (stream.peek() === ' ') {
                    let spaces = 0;
                    while (spaces < MaximumNumberOfWhitespacesPerSingleSpan && stream.peek() === ' ') {
                        ++spaces;
                        stream.next();
                    }
                    return 'whitespace whitespace-' + spaces;
                }
                while (!stream.eol() && stream.peek() !== ' ') {
                    stream.next();
                }
                return null;
            }
            const whitespaceMode = { token: nextToken };
            return CodeMirror.overlayMode(CodeMirror.getMode(config, mimeType), whitespaceMode, false);
        }
        CodeMirror.defineMode(modeName, modeConstructor);
        return modeName;
    }
    trailingWhitespaceOverlayMode(mimeType) {
        let modeName = CodeMirror.mimeModes[mimeType] ?
            (CodeMirror.mimeModes[mimeType].name || CodeMirror.mimeModes[mimeType]) :
            CodeMirror.mimeModes['text/plain'];
        modeName += '+trailing-whitespaces';
        if (CodeMirror.modes[modeName]) {
            return modeName;
        }
        /**
         * TODO: |config| is really a CodeMirror.EditorConfiguration
         */
        // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function modeConstructor(config, _parserConfig) {
            // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            function nextToken(stream) {
                if (stream.match(/^\s+$/, true)) {
                    return true ? 'trailing-whitespace' : null;
                }
                do {
                    stream.next();
                } while (!stream.eol() && stream.peek() !== ' ');
                return null;
            }
            const whitespaceMode = { token: nextToken };
            return CodeMirror.overlayMode(CodeMirror.getMode(config, mimeType), whitespaceMode, false);
        }
        CodeMirror.defineMode(modeName, modeConstructor);
        return modeName;
    }
    setupWhitespaceHighlight() {
        const doc = this.element.ownerDocument;
        if (whitespaceStyleInjectedSet.has(doc) ||
            !Common.Settings.Settings.instance().moduleSetting('showWhitespacesInEditor').get()) {
            return;
        }
        whitespaceStyleInjectedSet.add(doc);
        const classBase = '.show-whitespaces .CodeMirror .cm-whitespace-';
        const spaceChar = '·';
        let spaceChars = '';
        let rules = '';
        for (let i = 1; i <= MaximumNumberOfWhitespacesPerSingleSpan; ++i) {
            spaceChars += spaceChar;
            const rule = classBase + i + '::before { content: \'' + spaceChars + '\';}\n';
            rules += rule;
        }
        const style = doc.createElement('style');
        style.textContent = rules;
        doc.head.appendChild(style);
    }
    configureAutocomplete(config) {
        this.autocompleteConfig = config;
        this.updateAutocomplete();
    }
    updateAutocomplete() {
        super.configureAutocomplete(Common.Settings.Settings.instance().moduleSetting('textEditorAutocompletion').get() ? this.autocompleteConfig :
            null);
    }
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var Events;
(function (Events) {
    Events["GutterClick"] = "GutterClick";
    Events["SelectionChanged"] = "SelectionChanged";
    Events["ScrollChanged"] = "ScrollChanged";
    Events["EditorFocused"] = "EditorFocused";
    Events["EditorBlurred"] = "EditorBlurred";
    Events["JumpHappened"] = "JumpHappened";
})(Events || (Events = {}));
export class SourcesTextEditorDelegate {
    populateLineGutterContextMenu(_contextMenu, _lineNumber) {
        throw new Error('Not implemented');
    }
    populateTextAreaContextMenu(_contextMenu, _lineNumber, _columnNumber) {
        throw new Error('Not implemented');
    }
}
// https://crbug.com/1151919 * = !CodeMirror.Editor
// @ts-ignore https://crbug.com/1151919 CodeMirror types are incorrect
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
CodeMirror.commands.smartNewlineAndIndent = function (codeMirror) {
    codeMirror.operation(innerSmartNewlineAndIndent.bind(null, codeMirror));
    // https://crbug.com/1151919 * = !CodeMirror.Editor
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function innerSmartNewlineAndIndent(codeMirror) {
        const selections = codeMirror.listSelections();
        const replacements = [];
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            const cur = CodeMirror.cmpPos(selection.head, selection.anchor) < 0 ? selection.head : selection.anchor;
            const line = codeMirror.getLine(cur.line);
            const indent = TextUtils.TextUtils.Utils.lineIndent(line);
            replacements.push('\n' + indent.substring(0, Math.min(cur.ch, indent.length)));
        }
        // @ts-ignore replaceSelection has not been added to the types yet.
        codeMirror.replaceSelections(replacements);
        SourcesTextEditor.getForCodeMirror(codeMirror).onAutoAppendedSpaces();
    }
};
// https://crbug.com/1151919 * = !CodeMirror.Editor
// @ts-ignore https://crbug.com/1151919 CodeMirror types are incorrect
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
CodeMirror.commands.sourcesDismiss = function (codeMirror) {
    if (codeMirror.listSelections().length === 1 && SourcesTextEditor.getForCodeMirror(codeMirror).isSearchActive()) {
        return CodeMirror.Pass;
    }
    // @ts-ignore https://crbug.com/1151919 CodeMirror types are incorrect
    return CodeMirror.commands.dismiss(codeMirror);
};
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/naming-convention
export const _BlockIndentController = {
    name: 'blockIndentKeymap',
    // https://crbug.com/1151919 * = !CodeMirror.Editor
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Enter: function (codeMirror) {
        let selections = codeMirror.listSelections();
        const replacements = [];
        let allSelectionsAreCollapsedBlocks = false;
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            const start = CodeMirror.cmpPos(selection.head, selection.anchor) < 0 ? selection.head : selection.anchor;
            const line = codeMirror.getLine(start.line);
            const indent = TextUtils.TextUtils.Utils.lineIndent(line);
            let indentToInsert = '\n' + indent + SourcesTextEditor.getForCodeMirror(codeMirror).indent();
            let isCollapsedBlock = false;
            if (selection.head.ch === 0) {
                return CodeMirror.Pass;
            }
            if (line.substr(selection.head.ch - 1, 2) === '{}') {
                indentToInsert += '\n' + indent;
                isCollapsedBlock = true;
            }
            else if (line.substr(selection.head.ch - 1, 1) !== '{') {
                return CodeMirror.Pass;
            }
            if (i > 0 && allSelectionsAreCollapsedBlocks !== isCollapsedBlock) {
                return CodeMirror.Pass;
            }
            replacements.push(indentToInsert);
            allSelectionsAreCollapsedBlocks = isCollapsedBlock;
        }
        codeMirror.replaceSelections(replacements);
        if (!allSelectionsAreCollapsedBlocks) {
            SourcesTextEditor.getForCodeMirror(codeMirror).onAutoAppendedSpaces();
            return;
        }
        selections = codeMirror.listSelections();
        const updatedSelections = [];
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            const line = codeMirror.getLine(selection.head.line - 1);
            const position = new CodeMirror.Pos(selection.head.line - 1, line.length);
            updatedSelections.push({ head: position, anchor: position });
        }
        codeMirror.setSelections(updatedSelections);
        SourcesTextEditor.getForCodeMirror(codeMirror).onAutoAppendedSpaces();
    },
    // https://crbug.com/1151919 * = !CodeMirror.Editor
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    '\'}\'': function (codeMirror) {
        if (codeMirror.somethingSelected()) {
            return CodeMirror.Pass;
        }
        let selections = codeMirror.listSelections();
        let replacements = [];
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            const line = codeMirror.getLine(selection.head.line);
            if (line !== TextUtils.TextUtils.Utils.lineIndent(line)) {
                return CodeMirror.Pass;
            }
            replacements.push('}');
        }
        codeMirror.replaceSelections(replacements);
        selections = codeMirror.listSelections();
        replacements = [];
        const updatedSelections = [];
        for (let i = 0; i < selections.length; ++i) {
            const selection = selections[i];
            const matchingBracket = codeMirror.findMatchingBracket(selection.head);
            if (!matchingBracket || !matchingBracket.match) {
                return;
            }
            updatedSelections.push({ head: selection.head, anchor: new CodeMirror.Pos(selection.head.line, 0) });
            const line = codeMirror.getLine(matchingBracket.to.line);
            const indent = TextUtils.TextUtils.Utils.lineIndent(line);
            replacements.push(indent + '}');
        }
        codeMirror.setSelections(updatedSelections);
        codeMirror.replaceSelections(replacements);
    },
};
export class TokenHighlighter {
    textEditor;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    codeMirror;
    highlightDescriptor;
    highlightRegex;
    highlightRange;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchResultMarker;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchMatchLength;
    // https://crbug.com/1151919 * = !CodeMirror.Editor
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(textEditor, codeMirror) {
        this.textEditor = textEditor;
        this.codeMirror = codeMirror;
    }
    highlightSearchResults(regex, range) {
        const oldRegex = this.highlightRegex;
        this.highlightRegex = regex;
        this.highlightRange = range;
        if (this.searchResultMarker) {
            this.searchResultMarker.clear();
            delete this.searchResultMarker;
        }
        if (this.highlightDescriptor && this.highlightDescriptor.selectionStart) {
            this.codeMirror.removeLineClass(this.highlightDescriptor.selectionStart.line, 'wrap', 'cm-line-with-selection');
        }
        const selectionStart = this.highlightRange ? new CodeMirror.Pos(this.highlightRange.startLine, this.highlightRange.startColumn) : null;
        if (selectionStart) {
            this.codeMirror.addLineClass(selectionStart.line, 'wrap', 'cm-line-with-selection');
        }
        if (oldRegex && this.highlightRegex.toString() === oldRegex.toString()) {
            // Do not re-add overlay mode if regex did not change for better performance.
            if (this.highlightDescriptor) {
                this.highlightDescriptor.selectionStart = selectionStart;
            }
        }
        else {
            this.removeHighlight();
            this.setHighlighter(this.searchHighlighter.bind(this, this.highlightRegex), selectionStart);
        }
        if (this.highlightRange) {
            const pos = TextUtils.CodeMirrorUtils.toPos(this.highlightRange);
            this.searchResultMarker = this.codeMirror.markText(pos.start, pos.end, { className: 'cm-column-with-selection' });
        }
    }
    highlightedRegex() {
        return this.highlightRegex;
    }
    highlightSelectedTokens() {
        delete this.highlightRegex;
        delete this.highlightRange;
        if (this.highlightDescriptor && this.highlightDescriptor.selectionStart) {
            this.codeMirror.removeLineClass(this.highlightDescriptor.selectionStart.line, 'wrap', 'cm-line-with-selection');
        }
        this.removeHighlight();
        const selectionStart = this.codeMirror.getCursor('start');
        const selectionEnd = this.codeMirror.getCursor('end');
        if (selectionStart.line !== selectionEnd.line) {
            return;
        }
        if (selectionStart.ch === selectionEnd.ch) {
            return;
        }
        const selections = this.codeMirror.getSelections();
        if (selections.length > 1) {
            return;
        }
        const selectedText = selections[0];
        if (this.isWord(selectedText, selectionStart.line, selectionStart.ch, selectionEnd.ch)) {
            if (selectionStart) {
                this.codeMirror.addLineClass(selectionStart.line, 'wrap', 'cm-line-with-selection');
            }
            this.setHighlighter(this.tokenHighlighter.bind(this, selectedText, selectionStart), selectionStart);
        }
    }
    isWord(selectedText, lineNumber, startColumn, endColumn) {
        const line = this.codeMirror.getLine(lineNumber);
        const leftBound = startColumn === 0 || !TextUtils.TextUtils.Utils.isWordChar(line.charAt(startColumn - 1));
        const rightBound = endColumn === line.length || !TextUtils.TextUtils.Utils.isWordChar(line.charAt(endColumn));
        return leftBound && rightBound && TextUtils.TextUtils.Utils.isWord(selectedText);
    }
    removeHighlight() {
        if (this.highlightDescriptor) {
            this.codeMirror.removeOverlay(this.highlightDescriptor.overlay);
            delete this.highlightDescriptor;
        }
    }
    // https://crbug.com/1151919 * = !CodeMirror.StringStream
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchHighlighter(regex, stream) {
        if (stream.column() === 0) {
            delete this.searchMatchLength;
        }
        if (this.searchMatchLength) {
            if (this.searchMatchLength > 2) {
                for (let i = 0; i < this.searchMatchLength - 2; ++i) {
                    stream.next();
                }
                this.searchMatchLength = 1;
                return 'search-highlight';
            }
            stream.next();
            delete this.searchMatchLength;
            return 'search-highlight search-highlight-end';
        }
        const match = stream.string.slice(stream.pos).match(regex);
        if (match) {
            if (match.index === 0) {
                stream.next();
                const matchLength = match[0].length;
                if (matchLength === 1) {
                    return 'search-highlight search-highlight-full';
                }
                this.searchMatchLength = matchLength;
                return 'search-highlight search-highlight-start';
            }
            stream.pos += match.index;
        }
        else {
            stream.skipToEnd();
        }
        return null;
    }
    // https://crbug.com/1151919 * = !CodeMirror.Position selectionStart
    // https://crbug.com/1151919 * = !CodeMirror.StringStream stream
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokenHighlighter(token, selectionStart, stream) {
        const tokenFirstChar = token.charAt(0);
        if (stream.match(token) && (stream.eol() || !TextUtils.TextUtils.Utils.isWordChar(stream.peek()))) {
            return stream.column() === selectionStart.ch ? 'token-highlight column-with-selection' : 'token-highlight';
        }
        let eatenChar;
        do {
            eatenChar = stream.next();
        } while (eatenChar && (TextUtils.TextUtils.Utils.isWordChar(eatenChar) || stream.peek() !== tokenFirstChar));
        return null;
    }
    // https://crbug.com/1151919 * = !CodeMirror.StringStream
    // https://crbug.com/1151919 * = ?CodeMirror.Position
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHighlighter(highlighter, selectionStart) {
        const overlayMode = { token: highlighter };
        this.codeMirror.addOverlay(overlayMode);
        this.highlightDescriptor = { overlay: overlayMode, selectionStart: selectionStart };
    }
}
const LinesToScanForIndentationGuessing = 1000;
const MaximumNumberOfWhitespacesPerSingleSpan = 16;
export const lineNumbersGutterType = 'CodeMirror-linenumbers';
//# sourceMappingURL=SourcesTextEditor.js.map