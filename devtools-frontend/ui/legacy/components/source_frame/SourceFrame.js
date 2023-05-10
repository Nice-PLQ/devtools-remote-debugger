/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../../../../core/common/common.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import * as Formatter from '../../../../models/formatter/formatter.js';
import * as TextUtils from '../../../../models/text_utils/text_utils.js';
import * as UI from '../../legacy.js';
import { Events, SourcesTextEditor } from './SourcesTextEditor.js';
const UIStrings = {
    /**
    *@description Text for the source of something
    */
    source: 'Source',
    /**
    *@description Text to pretty print a file
    */
    prettyPrint: 'Pretty print',
    /**
    *@description Text when something is loading
    */
    loading: 'Loading…',
    /**
    * @description Shown at the bottom of the Sources panel when the user has made multiple
    * simultaneous text selections in the text editor.
    * @example {2} PH1
    */
    dSelectionRegions: '{PH1} selection regions',
    /**
    * @description Position indicator in Source Frame of the Sources panel. The placeholder is a
    * hexadecimal number value, which is why it is prefixed with '0x'.
    * @example {abc} PH1
    */
    bytecodePositionXs: 'Bytecode position `0x`{PH1}',
    /**
    *@description Text in Source Frame of the Sources panel
    *@example {2} PH1
    *@example {2} PH2
    */
    lineSColumnS: 'Line {PH1}, Column {PH2}',
    /**
    *@description Text in Source Frame of the Sources panel
    *@example {2} PH1
    */
    dCharactersSelected: '{PH1} characters selected',
    /**
    *@description Text in Source Frame of the Sources panel
    *@example {2} PH1
    *@example {2} PH2
    */
    dLinesDCharactersSelected: '{PH1} lines, {PH2} characters selected',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/source_frame/SourceFrame.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class SourceFrameImpl extends UI.View.SimpleView {
    lazyContent;
    prettyInternal;
    rawContent;
    formattedContentPromise;
    formattedMap;
    prettyToggle;
    shouldAutoPrettyPrint;
    progressToolbarItem;
    textEditorInternal;
    prettyCleanGeneration;
    cleanGeneration;
    searchConfig;
    delayedFindSearchMatches;
    currentSearchResultIndex;
    searchResults;
    searchRegex;
    loadError;
    muteChangeEventsForSetContent;
    sourcePosition;
    searchableView;
    editable;
    positionToReveal;
    lineToScrollTo;
    selectionToSet;
    loadedInternal;
    contentRequested;
    highlighterTypeInternal;
    wasmDisassemblyInternal;
    contentSet;
    constructor(lazyContent, codeMirrorOptions) {
        super(i18nString(UIStrings.source));
        this.lazyContent = lazyContent;
        this.prettyInternal = false;
        this.rawContent = null;
        this.formattedContentPromise = null;
        this.formattedMap = null;
        this.prettyToggle = new UI.Toolbar.ToolbarToggle(i18nString(UIStrings.prettyPrint), 'largeicon-pretty-print');
        this.prettyToggle.addEventListener(UI.Toolbar.ToolbarButton.Events.Click, () => {
            this.setPretty(!this.prettyToggle.toggled());
        });
        this.shouldAutoPrettyPrint = false;
        this.prettyToggle.setVisible(false);
        this.progressToolbarItem = new UI.Toolbar.ToolbarItem(document.createElement('div'));
        this.textEditorInternal = new SourcesTextEditor(this, codeMirrorOptions);
        this.textEditorInternal.show(this.element);
        this.prettyCleanGeneration = null;
        this.cleanGeneration = 0;
        this.searchConfig = null;
        this.delayedFindSearchMatches = null;
        this.currentSearchResultIndex = -1;
        this.searchResults = [];
        this.searchRegex = null;
        this.loadError = false;
        this.textEditorInternal.addEventListener(Events.EditorFocused, this.resetCurrentSearchResultIndex, this);
        this.textEditorInternal.addEventListener(Events.SelectionChanged, this.updateSourcePosition, this);
        this.textEditorInternal.addEventListener(UI.TextEditor.Events.TextChanged, event => {
            if (!this.muteChangeEventsForSetContent) {
                this.onTextChanged(event.data.oldRange, event.data.newRange);
            }
        });
        this.muteChangeEventsForSetContent = false;
        this.sourcePosition = new UI.Toolbar.ToolbarText();
        this.searchableView = null;
        this.editable = false;
        this.textEditorInternal.setReadOnly(true);
        this.positionToReveal = null;
        this.lineToScrollTo = null;
        this.selectionToSet = null;
        this.loadedInternal = false;
        this.contentRequested = false;
        this.highlighterTypeInternal = '';
        this.wasmDisassemblyInternal = null;
        this.contentSet = false;
    }
    get wasmDisassembly() {
        return this.wasmDisassemblyInternal;
    }
    editorLocationToUILocation(lineNumber, columnNumber) {
        if (this.wasmDisassemblyInternal) {
            columnNumber = this.wasmDisassemblyInternal.lineNumberToBytecodeOffset(lineNumber);
            lineNumber = 0;
        }
        else if (this.prettyInternal) {
            [lineNumber, columnNumber] = this.prettyToRawLocation(lineNumber, columnNumber);
        }
        return { lineNumber, columnNumber };
    }
    uiLocationToEditorLocation(lineNumber, columnNumber = 0) {
        if (this.wasmDisassemblyInternal) {
            lineNumber = this.wasmDisassemblyInternal.bytecodeOffsetToLineNumber(columnNumber);
            columnNumber = 0;
        }
        else if (this.prettyInternal) {
            [lineNumber, columnNumber] = this.rawToPrettyLocation(lineNumber, columnNumber);
        }
        return { lineNumber, columnNumber };
    }
    setCanPrettyPrint(canPrettyPrint, autoPrettyPrint) {
        this.shouldAutoPrettyPrint = canPrettyPrint && Boolean(autoPrettyPrint);
        this.prettyToggle.setVisible(canPrettyPrint);
    }
    async setPretty(value) {
        this.prettyInternal = value;
        this.prettyToggle.setEnabled(false);
        const wasLoaded = this.loaded;
        const selection = this.selection();
        let newSelection;
        if (this.prettyInternal) {
            const formatInfo = await this.requestFormattedContent();
            this.formattedMap = formatInfo.formattedMapping;
            this.setContent(formatInfo.formattedContent, null);
            this.prettyCleanGeneration = this.textEditorInternal.markClean();
            const start = this.rawToPrettyLocation(selection.startLine, selection.startColumn);
            const end = this.rawToPrettyLocation(selection.endLine, selection.endColumn);
            newSelection = new TextUtils.TextRange.TextRange(start[0], start[1], end[0], end[1]);
        }
        else {
            this.setContent(this.rawContent, null);
            this.cleanGeneration = this.textEditorInternal.markClean();
            const start = this.prettyToRawLocation(selection.startLine, selection.startColumn);
            const end = this.prettyToRawLocation(selection.endLine, selection.endColumn);
            newSelection = new TextUtils.TextRange.TextRange(start[0], start[1], end[0], end[1]);
        }
        if (wasLoaded) {
            this.textEditor.revealPosition(newSelection.endLine, newSelection.endColumn, this.editable);
            this.textEditor.setSelection(newSelection);
        }
        this.prettyToggle.setEnabled(true);
        this.updatePrettyPrintState();
    }
    updateLineNumberFormatter() {
        if (this.wasmDisassemblyInternal) {
            const disassembly = this.wasmDisassemblyInternal;
            const lastBytecodeOffset = disassembly.lineNumberToBytecodeOffset(disassembly.lineNumbers - 1);
            const bytecodeOffsetDigits = lastBytecodeOffset.toString(16).length + 1;
            this.textEditorInternal.setLineNumberFormatter(lineNumber => {
                const bytecodeOffset = disassembly.lineNumberToBytecodeOffset(lineNumber - 1);
                return `0x${bytecodeOffset.toString(16).padStart(bytecodeOffsetDigits, '0')}`;
            });
        }
        else if (this.prettyInternal) {
            this.textEditorInternal.setLineNumberFormatter(lineNumber => {
                const line = this.prettyToRawLocation(lineNumber - 1, 0)[0] + 1;
                if (lineNumber === 1) {
                    return String(line);
                }
                if (line !== this.prettyToRawLocation(lineNumber - 2, 0)[0] + 1) {
                    return String(line);
                }
                return '-';
            });
        }
        else {
            this.textEditorInternal.setLineNumberFormatter(lineNumber => {
                return String(lineNumber);
            });
        }
    }
    updatePrettyPrintState() {
        this.prettyToggle.setToggled(this.prettyInternal);
        this.textEditorInternal.element.classList.toggle('pretty-printed', this.prettyInternal);
        this.updateLineNumberFormatter();
    }
    prettyToRawLocation(line, column = 0) {
        if (!this.formattedMap) {
            return [line, column];
        }
        return this.formattedMap.formattedToOriginal(line, column);
    }
    rawToPrettyLocation(line, column) {
        if (!this.formattedMap) {
            return [line, column];
        }
        return this.formattedMap.originalToFormatted(line, column);
    }
    setEditable(editable) {
        this.editable = editable;
        if (this.loadedInternal) {
            this.textEditorInternal.setReadOnly(!editable);
        }
    }
    hasLoadError() {
        return this.loadError;
    }
    wasShown() {
        this.ensureContentLoaded();
        this.wasShownOrLoaded();
    }
    willHide() {
        super.willHide();
        this.clearPositionToReveal();
    }
    async toolbarItems() {
        return [this.prettyToggle, this.sourcePosition, this.progressToolbarItem];
    }
    get loaded() {
        return this.loadedInternal;
    }
    get textEditor() {
        return this.textEditorInternal;
    }
    get pretty() {
        return this.prettyInternal;
    }
    async ensureContentLoaded() {
        if (!this.contentRequested) {
            this.contentRequested = true;
            const progressIndicator = new UI.ProgressIndicator.ProgressIndicator();
            progressIndicator.setTitle(i18nString(UIStrings.loading));
            progressIndicator.setTotalWork(100);
            this.progressToolbarItem.element.appendChild(progressIndicator.element);
            const deferredContent = await this.lazyContent();
            let error, content;
            if (deferredContent.content === null) {
                error = deferredContent.error;
                this.rawContent = deferredContent.error;
            }
            else {
                content = deferredContent.content;
                this.rawContent = deferredContent.isEncoded ? window.atob(deferredContent.content) : deferredContent.content;
            }
            progressIndicator.setWorked(1);
            if (!error && this.highlighterTypeInternal === 'application/wasm') {
                const worker = Common.Worker.WorkerWrapper.fromURL(new URL('../../../../entrypoints/wasmparser_worker/wasmparser_worker-entrypoint.js', import.meta.url));
                const promise = new Promise((resolve, reject) => {
                    worker.onmessage =
                        /** @type {{event:string, params:{percentage:number}}} */
                        // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ({ data }) => {
                            if ('event' in data) {
                                switch (data.event) {
                                    case 'progress':
                                        progressIndicator.setWorked(data.params.percentage);
                                        break;
                                }
                            }
                            else if ('method' in data) {
                                switch (data.method) {
                                    case 'disassemble':
                                        if ('error' in data) {
                                            reject(data.error);
                                        }
                                        else if ('result' in data) {
                                            resolve(data.result);
                                        }
                                        break;
                                }
                            }
                        };
                    worker.onerror = reject;
                });
                worker.postMessage({ method: 'disassemble', params: { content } });
                try {
                    const { source, offsets, functionBodyOffsets } = await promise;
                    this.rawContent = content = source;
                    this.wasmDisassemblyInternal = new Common.WasmDisassembly.WasmDisassembly(offsets, functionBodyOffsets);
                }
                catch (e) {
                    this.rawContent = content = error = e.message;
                }
                finally {
                    worker.terminate();
                }
            }
            progressIndicator.setWorked(100);
            progressIndicator.done();
            this.formattedContentPromise = null;
            this.formattedMap = null;
            this.prettyToggle.setEnabled(true);
            if (error) {
                this.setContent(null, error);
                this.prettyToggle.setEnabled(false);
                // Occasionally on load, there can be a race in which it appears the CodeMirror plugin
                // runs the highlighter type assignment out of order. In case of an error then, set
                // the highlighter type after a short delay. This appears to only occur the first
                // time that CodeMirror is initialized, likely because the highlighter type was first
                // initialized based on the file type, and the syntax highlighting is in a race
                // with the new highlighter assignment. As the option is just an option and is not
                // observable, we can't handle waiting for it here.
                // https://github.com/codemirror/CodeMirror/issues/6019
                // CRBug 1011445
                setTimeout(() => this.setHighlighterType('text/plain'), 50);
            }
            else {
                if (this.shouldAutoPrettyPrint && TextUtils.TextUtils.isMinified(content)) {
                    await this.setPretty(true);
                }
                else {
                    this.setContent(this.rawContent, null);
                }
            }
            this.contentSet = true;
        }
    }
    requestFormattedContent() {
        if (this.formattedContentPromise) {
            return this.formattedContentPromise;
        }
        this.formattedContentPromise =
            Formatter.ScriptFormatter.formatScriptContent(this.highlighterTypeInternal, this.rawContent || '');
        return this.formattedContentPromise;
    }
    revealPosition(line, column, shouldHighlight) {
        this.lineToScrollTo = null;
        this.selectionToSet = null;
        this.positionToReveal = { line: line, column: column, shouldHighlight: shouldHighlight };
        this.innerRevealPositionIfNeeded();
    }
    innerRevealPositionIfNeeded() {
        if (!this.positionToReveal) {
            return;
        }
        if (!this.loaded || !this.isShowing()) {
            return;
        }
        const { lineNumber, columnNumber } = this.uiLocationToEditorLocation(this.positionToReveal.line, this.positionToReveal.column);
        this.textEditorInternal.revealPosition(lineNumber, columnNumber, this.positionToReveal.shouldHighlight);
        this.positionToReveal = null;
    }
    clearPositionToReveal() {
        this.textEditorInternal.clearPositionHighlight();
        this.positionToReveal = null;
    }
    scrollToLine(line) {
        this.clearPositionToReveal();
        this.lineToScrollTo = line;
        this.innerScrollToLineIfNeeded();
    }
    innerScrollToLineIfNeeded() {
        if (this.lineToScrollTo !== null) {
            if (this.loaded && this.isShowing()) {
                this.textEditorInternal.scrollToLine(this.lineToScrollTo);
                this.lineToScrollTo = null;
            }
        }
    }
    selection() {
        return this.textEditor.selection();
    }
    setSelection(textRange) {
        this.selectionToSet = textRange;
        this.innerSetSelectionIfNeeded();
    }
    innerSetSelectionIfNeeded() {
        if (this.selectionToSet && this.loaded && this.isShowing()) {
            this.textEditorInternal.setSelection(this.selectionToSet, true);
            this.selectionToSet = null;
        }
    }
    wasShownOrLoaded() {
        this.innerRevealPositionIfNeeded();
        this.innerSetSelectionIfNeeded();
        this.innerScrollToLineIfNeeded();
    }
    onTextChanged(_oldRange, _newRange) {
        const wasPretty = this.pretty;
        this.prettyInternal = this.prettyCleanGeneration !== null && this.textEditor.isClean(this.prettyCleanGeneration);
        if (this.prettyInternal !== wasPretty) {
            this.updatePrettyPrintState();
        }
        this.prettyToggle.setEnabled(this.isClean());
        if (this.searchConfig && this.searchableView) {
            this.performSearch(this.searchConfig, false, false);
        }
    }
    isClean() {
        return this.textEditor.isClean(this.cleanGeneration) ||
            (this.prettyCleanGeneration !== null && this.textEditor.isClean(this.prettyCleanGeneration));
    }
    contentCommitted() {
        this.cleanGeneration = this.textEditorInternal.markClean();
        this.prettyCleanGeneration = null;
        this.rawContent = this.textEditor.text();
        this.formattedMap = null;
        this.formattedContentPromise = null;
        if (this.prettyInternal) {
            this.prettyInternal = false;
            this.updatePrettyPrintState();
        }
        this.prettyToggle.setEnabled(true);
    }
    simplifyMimeType(content, mimeType) {
        if (!mimeType) {
            return '';
        }
        // There are plenty of instances where TSX/JSX files are served with out the trailing x, i.e. JSX with a 'js' suffix
        // which breaks the formatting. Therefore, if the mime type is TypeScript or JavaScript, we switch to the TSX/JSX
        // superset so that we don't break formatting.
        if (mimeType.indexOf('typescript') >= 0) {
            return 'text/typescript-jsx';
        }
        if (mimeType.indexOf('javascript') >= 0 || mimeType.indexOf('jscript') >= 0 ||
            mimeType.indexOf('ecmascript') >= 0) {
            return 'text/jsx';
        }
        // A hack around the fact that files with "php" extension might be either standalone or html embedded php scripts.
        if (mimeType === 'text/x-php' && content.match(/\<\?.*\?\>/g)) {
            return 'application/x-httpd-php';
        }
        if (mimeType === 'application/wasm') {
            // text/webassembly is not a proper MIME type, but CodeMirror uses it for WAT syntax highlighting.
            // We generally use application/wasm, which is the correct MIME type for Wasm binary data.
            return 'text/webassembly';
        }
        return mimeType;
    }
    setHighlighterType(highlighterType) {
        this.highlighterTypeInternal = highlighterType;
        this.updateHighlighterType('');
    }
    highlighterType() {
        return this.highlighterTypeInternal;
    }
    updateHighlighterType(content) {
        this.textEditorInternal.setMimeType(this.simplifyMimeType(content, this.highlighterTypeInternal));
    }
    setContent(content, loadError) {
        this.muteChangeEventsForSetContent = true;
        if (!this.loadedInternal) {
            this.loadedInternal = true;
            if (!loadError) {
                this.textEditorInternal.setText(content || '');
                this.cleanGeneration = this.textEditorInternal.markClean();
                this.textEditorInternal.setReadOnly(!this.editable);
                this.loadError = false;
            }
            else {
                this.textEditorInternal.setText(loadError || '');
                this.highlighterTypeInternal = 'text/plain';
                this.textEditorInternal.setReadOnly(true);
                this.loadError = true;
            }
        }
        else {
            const scrollTop = this.textEditorInternal.scrollTop();
            const selection = this.textEditorInternal.selection();
            this.textEditorInternal.setText(content || '');
            this.textEditorInternal.setScrollTop(scrollTop);
            this.textEditorInternal.setSelection(selection);
        }
        // Mark non-breakable lines in the Wasm disassembly after setting
        // up the content for the text editor (which creates the gutter).
        if (this.wasmDisassemblyInternal) {
            for (const lineNumber of this.wasmDisassemblyInternal.nonBreakableLineNumbers()) {
                this.textEditorInternal.toggleLineClass(lineNumber, 'cm-non-breakable-line', true);
            }
        }
        this.updateLineNumberFormatter();
        this.updateHighlighterType(content || '');
        this.wasShownOrLoaded();
        if (this.delayedFindSearchMatches) {
            this.delayedFindSearchMatches();
            this.delayedFindSearchMatches = null;
        }
        this.muteChangeEventsForSetContent = false;
    }
    setSearchableView(view) {
        this.searchableView = view;
    }
    doFindSearchMatches(searchConfig, shouldJump, jumpBackwards) {
        this.currentSearchResultIndex = -1;
        this.searchResults = [];
        const regex = searchConfig.toSearchRegex();
        this.searchRegex = regex;
        this.searchResults = this.collectRegexMatches(regex);
        if (this.searchableView) {
            this.searchableView.updateSearchMatchesCount(this.searchResults.length);
        }
        if (!this.searchResults.length) {
            this.textEditorInternal.cancelSearchResultsHighlight();
        }
        else if (shouldJump && jumpBackwards) {
            this.jumpToPreviousSearchResult();
        }
        else if (shouldJump) {
            this.jumpToNextSearchResult();
        }
        else {
            this.textEditorInternal.highlightSearchResults(regex, null);
        }
    }
    performSearch(searchConfig, shouldJump, jumpBackwards) {
        if (this.searchableView) {
            this.searchableView.updateSearchMatchesCount(0);
        }
        this.resetSearch();
        this.searchConfig = searchConfig;
        if (this.loaded) {
            this.doFindSearchMatches(searchConfig, shouldJump, Boolean(jumpBackwards));
        }
        else {
            this.delayedFindSearchMatches =
                this.doFindSearchMatches.bind(this, searchConfig, shouldJump, Boolean(jumpBackwards));
        }
        this.ensureContentLoaded();
    }
    resetCurrentSearchResultIndex() {
        if (!this.searchResults.length) {
            return;
        }
        this.currentSearchResultIndex = -1;
        if (this.searchableView) {
            this.searchableView.updateCurrentMatchIndex(this.currentSearchResultIndex);
        }
        this.textEditorInternal.highlightSearchResults(this.searchRegex, null);
    }
    resetSearch() {
        this.searchConfig = null;
        this.delayedFindSearchMatches = null;
        this.currentSearchResultIndex = -1;
        this.searchResults = [];
        this.searchRegex = null;
    }
    searchCanceled() {
        const range = this.currentSearchResultIndex !== -1 ? this.searchResults[this.currentSearchResultIndex] : null;
        this.resetSearch();
        if (!this.loaded) {
            return;
        }
        this.textEditorInternal.cancelSearchResultsHighlight();
        if (range) {
            this.setSelection(range);
        }
    }
    jumpToLastSearchResult() {
        this.jumpToSearchResult(this.searchResults.length - 1);
    }
    searchResultIndexForCurrentSelection() {
        return Platform.ArrayUtilities.lowerBound(this.searchResults, this.textEditorInternal.selection().collapseToEnd(), TextUtils.TextRange.TextRange.comparator);
    }
    jumpToNextSearchResult() {
        const currentIndex = this.searchResultIndexForCurrentSelection();
        const nextIndex = this.currentSearchResultIndex === -1 ? currentIndex : currentIndex + 1;
        this.jumpToSearchResult(nextIndex);
    }
    jumpToPreviousSearchResult() {
        const currentIndex = this.searchResultIndexForCurrentSelection();
        this.jumpToSearchResult(currentIndex - 1);
    }
    supportsCaseSensitiveSearch() {
        return true;
    }
    supportsRegexSearch() {
        return true;
    }
    jumpToSearchResult(index) {
        if (!this.loaded || !this.searchResults.length) {
            return;
        }
        this.currentSearchResultIndex = (index + this.searchResults.length) % this.searchResults.length;
        if (this.searchableView) {
            this.searchableView.updateCurrentMatchIndex(this.currentSearchResultIndex);
        }
        this.textEditorInternal.highlightSearchResults(this.searchRegex, this.searchResults[this.currentSearchResultIndex]);
    }
    replaceSelectionWith(searchConfig, replacement) {
        const range = this.searchResults[this.currentSearchResultIndex];
        if (!range) {
            return;
        }
        this.textEditorInternal.highlightSearchResults(this.searchRegex, null);
        const oldText = this.textEditorInternal.text(range);
        const regex = searchConfig.toSearchRegex();
        let text;
        if (regex.__fromRegExpQuery) {
            text = oldText.replace(regex, replacement);
        }
        else {
            text = oldText.replace(regex, function () {
                return replacement;
            });
        }
        const newRange = this.textEditorInternal.editRange(range, text);
        this.textEditorInternal.setSelection(newRange.collapseToEnd());
    }
    replaceAllWith(searchConfig, replacement) {
        this.resetCurrentSearchResultIndex();
        let text = this.textEditorInternal.text();
        const range = this.textEditorInternal.fullRange();
        const regex = searchConfig.toSearchRegex(true);
        if (regex.__fromRegExpQuery) {
            text = text.replace(regex, replacement);
        }
        else {
            text = text.replace(regex, function () {
                return replacement;
            });
        }
        const ranges = this.collectRegexMatches(regex);
        if (!ranges.length) {
            return;
        }
        // Calculate the position of the end of the last range to be edited.
        const currentRangeIndex = Platform.ArrayUtilities.lowerBound(ranges, this.textEditorInternal.selection(), TextUtils.TextRange.TextRange.comparator);
        const lastRangeIndex = Platform.NumberUtilities.mod(currentRangeIndex - 1, ranges.length);
        const lastRange = ranges[lastRangeIndex];
        const replacementLineEndings = Platform.StringUtilities.findLineEndingIndexes(replacement);
        const replacementLineCount = replacementLineEndings.length;
        const lastLineNumber = lastRange.startLine + replacementLineEndings.length - 1;
        let lastColumnNumber = lastRange.startColumn;
        if (replacementLineEndings.length > 1) {
            lastColumnNumber =
                replacementLineEndings[replacementLineCount - 1] - replacementLineEndings[replacementLineCount - 2] - 1;
        }
        this.textEditorInternal.editRange(range, text);
        this.textEditorInternal.revealPosition(lastLineNumber, lastColumnNumber);
        this.textEditorInternal.setSelection(TextUtils.TextRange.TextRange.createFromLocation(lastLineNumber, lastColumnNumber));
    }
    collectRegexMatches(regexObject) {
        const ranges = [];
        for (let i = 0; i < this.textEditorInternal.linesCount; ++i) {
            let line = this.textEditorInternal.line(i);
            let offset = 0;
            let match;
            do {
                match = regexObject.exec(line);
                if (match) {
                    const matchEndIndex = match.index + Math.max(match[0].length, 1);
                    if (match[0].length) {
                        ranges.push(new TextUtils.TextRange.TextRange(i, offset + match.index, i, offset + matchEndIndex));
                    }
                    offset += matchEndIndex;
                    line = line.substring(matchEndIndex);
                }
            } while (match && line);
        }
        return ranges;
    }
    populateLineGutterContextMenu(_contextMenu, _editorLineNumber) {
        return Promise.resolve();
    }
    populateTextAreaContextMenu(_contextMenu, _editorLineNumber, _editorColumnNumber) {
        return Promise.resolve();
    }
    canEditSource() {
        return this.editable;
    }
    updateSourcePosition() {
        const selections = this.textEditorInternal.selections();
        if (!selections.length) {
            return;
        }
        if (selections.length > 1) {
            this.sourcePosition.setText(i18nString(UIStrings.dSelectionRegions, { PH1: selections.length }));
            return;
        }
        let textRange = selections[0];
        if (textRange.isEmpty()) {
            const location = this.prettyToRawLocation(textRange.endLine, textRange.endColumn);
            if (this.wasmDisassemblyInternal) {
                const disassembly = this.wasmDisassemblyInternal;
                const lastBytecodeOffset = disassembly.lineNumberToBytecodeOffset(disassembly.lineNumbers - 1);
                const bytecodeOffsetDigits = lastBytecodeOffset.toString(16).length;
                const bytecodeOffset = disassembly.lineNumberToBytecodeOffset(location[0]);
                this.sourcePosition.setText(i18nString(UIStrings.bytecodePositionXs, { PH1: bytecodeOffset.toString(16).padStart(bytecodeOffsetDigits, '0') }));
            }
            else {
                if (!this.canEditSource()) {
                    this.textEditorInternal.revealPosition(textRange.endLine, textRange.endColumn, true);
                }
                this.sourcePosition.setText(i18nString(UIStrings.lineSColumnS, { PH1: location[0] + 1, PH2: location[1] + 1 }));
            }
            return;
        }
        textRange = textRange.normalize();
        const selectedText = this.textEditorInternal.text(textRange);
        if (textRange.startLine === textRange.endLine) {
            this.sourcePosition.setText(i18nString(UIStrings.dCharactersSelected, { PH1: selectedText.length }));
        }
        else {
            this.sourcePosition.setText(i18nString(UIStrings.dLinesDCharactersSelected, { PH1: textRange.endLine - textRange.startLine + 1, PH2: selectedText.length }));
        }
    }
}
const registeredLineDecorators = [];
export function registerLineDecorator(registration) {
    registeredLineDecorators.push(registration);
}
export function getRegisteredLineDecorators() {
    return registeredLineDecorators;
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var DecoratorType;
(function (DecoratorType) {
    DecoratorType["PERFORMANCE"] = "performance";
    DecoratorType["MEMORY"] = "memory";
    DecoratorType["COVERAGE"] = "coverage";
})(DecoratorType || (DecoratorType = {}));
//# sourceMappingURL=SourceFrame.js.map