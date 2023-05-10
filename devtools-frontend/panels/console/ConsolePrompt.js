// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as ObjectUI from '../../ui/legacy/components/object_ui/object_ui.js';
import * as TextEditor from '../../ui/legacy/components/text_editor/text_editor.js';
import * as UI from '../../ui/legacy/legacy.js';
import { ConsolePanel } from './ConsolePanel.js';
import consolePromptStyles from './consolePrompt.css.js';
const UIStrings = {
    /**
    *@description Text in Console Prompt of the Console panel
    */
    consolePrompt: 'Console prompt',
};
const str_ = i18n.i18n.registerUIStrings('panels/console/ConsolePrompt.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class ConsolePrompt extends Common.ObjectWrapper.eventMixin(UI.Widget.Widget) {
    addCompletionsFromHistory;
    historyInternal;
    initialText;
    editor;
    eagerPreviewElement;
    textChangeThrottler;
    formatter;
    requestPreviewBound;
    innerPreviewElement;
    promptIcon;
    iconThrottler;
    eagerEvalSetting;
    previewRequestForTest;
    defaultAutocompleteConfig;
    highlightingNode;
    constructor() {
        super();
        this.addCompletionsFromHistory = true;
        this.historyInternal = new ConsoleHistoryManager();
        this.initialText = '';
        this.editor = null;
        this.eagerPreviewElement = document.createElement('div');
        this.eagerPreviewElement.classList.add('console-eager-preview');
        this.textChangeThrottler = new Common.Throttler.Throttler(150);
        this.formatter = new ObjectUI.RemoteObjectPreviewFormatter.RemoteObjectPreviewFormatter();
        this.requestPreviewBound = this.requestPreview.bind(this);
        this.innerPreviewElement = this.eagerPreviewElement.createChild('div', 'console-eager-inner-preview');
        this.eagerPreviewElement.appendChild(UI.Icon.Icon.create('smallicon-command-result', 'preview-result-icon'));
        const editorContainerElement = this.element.createChild('div', 'console-prompt-editor-container');
        this.element.appendChild(this.eagerPreviewElement);
        this.promptIcon = UI.Icon.Icon.create('smallicon-text-prompt', 'console-prompt-icon');
        this.element.appendChild(this.promptIcon);
        this.iconThrottler = new Common.Throttler.Throttler(0);
        this.eagerEvalSetting = Common.Settings.Settings.instance().moduleSetting('consoleEagerEval');
        this.eagerEvalSetting.addChangeListener(this.eagerSettingChanged.bind(this));
        this.eagerPreviewElement.classList.toggle('hidden', !this.eagerEvalSetting.get());
        this.element.tabIndex = 0;
        this.previewRequestForTest = null;
        this.defaultAutocompleteConfig = null;
        this.highlightingNode = false;
        const factory = TextEditor.CodeMirrorTextEditor.CodeMirrorTextEditorFactory.instance();
        const options = {
            devtoolsAccessibleName: i18nString(UIStrings.consolePrompt),
            lineNumbers: false,
            lineWrapping: true,
            mimeType: 'javascript',
            autoHeight: true,
        };
        this.editor = factory.createEditor(options);
        this.defaultAutocompleteConfig =
            ObjectUI.JavaScriptAutocomplete.JavaScriptAutocompleteConfig.createConfigForEditor(this.editor);
        this.editor.configureAutocomplete(Object.assign({}, this.defaultAutocompleteConfig, {
            suggestionsCallback: this.wordsWithQuery.bind(this),
            anchorBehavior: "PreferTop" /* PreferTop */,
        }));
        this.editor.widget().element.addEventListener('keydown', this.editorKeyDown.bind(this), true);
        this.editor.widget().show(editorContainerElement);
        this.editor.addEventListener(UI.TextEditor.Events.CursorChanged, this.updatePromptIcon, this);
        this.editor.addEventListener(UI.TextEditor.Events.TextChanged, this.onTextChanged, this);
        this.editor.addEventListener(UI.TextEditor.Events.SuggestionChanged, this.onTextChanged, this);
        this.setText(this.initialText);
        this.initialText = '';
        if (this.hasFocus()) {
            this.focus();
        }
        this.element.removeAttribute('tabindex');
        this.editor.widget().element.tabIndex = -1;
        this.editorSetForTest();
        // Record the console tool load time after the console prompt constructor is complete.
        Host.userMetrics.panelLoaded('console', 'DevTools.Launch.Console');
    }
    eagerSettingChanged() {
        const enabled = this.eagerEvalSetting.get();
        this.eagerPreviewElement.classList.toggle('hidden', !enabled);
        if (enabled) {
            this.requestPreview();
        }
    }
    belowEditorElement() {
        return this.eagerPreviewElement;
    }
    onTextChanged() {
        // ConsoleView and prompt both use a throttler, so we clear the preview
        // ASAP to avoid inconsistency between a fresh viewport and stale preview.
        if (this.eagerEvalSetting.get()) {
            const asSoonAsPossible = !this.editor || !this.editor.textWithCurrentSuggestion();
            this.previewRequestForTest = this.textChangeThrottler.schedule(this.requestPreviewBound, asSoonAsPossible);
        }
        this.updatePromptIcon();
        this.dispatchEventToListeners("TextChanged" /* TextChanged */);
    }
    async requestPreview() {
        if (!this.editor) {
            return;
        }
        const text = this.editor.textWithCurrentSuggestion().trim();
        const executionContext = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
        const { preview, result } = await ObjectUI.JavaScriptREPL.JavaScriptREPL.evaluateAndBuildPreview(text, true /* throwOnSideEffect */, true /* replMode */, 500 /* timeout */);
        this.innerPreviewElement.removeChildren();
        if (preview.deepTextContent() !== this.editor.textWithCurrentSuggestion().trim()) {
            this.innerPreviewElement.appendChild(preview);
        }
        if (result && 'object' in result && result.object && result.object.subtype === 'node') {
            this.highlightingNode = true;
            SDK.OverlayModel.OverlayModel.highlightObjectAsDOMNode(result.object);
        }
        else if (this.highlightingNode) {
            this.highlightingNode = false;
            SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
        }
        if (result && executionContext) {
            executionContext.runtimeModel.releaseEvaluationResult(result);
        }
    }
    wasShown() {
        super.wasShown();
        this.registerCSSFiles([consolePromptStyles]);
    }
    willHide() {
        if (this.highlightingNode) {
            this.highlightingNode = false;
            SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
        }
    }
    history() {
        return this.historyInternal;
    }
    clearAutocomplete() {
        if (this.editor) {
            this.editor.clearAutocomplete();
        }
    }
    isCaretAtEndOfPrompt() {
        return this.editor !== null &&
            this.editor.selection().collapseToEnd().equal(this.editor.fullRange().collapseToEnd());
    }
    moveCaretToEndOfPrompt() {
        if (this.editor) {
            this.editor.setSelection(TextUtils.TextRange.TextRange.createFromLocation(Infinity, Infinity));
        }
    }
    setText(text) {
        if (this.editor) {
            this.editor.setText(text);
        }
        else {
            this.initialText = text;
        }
        this.dispatchEventToListeners("TextChanged" /* TextChanged */);
    }
    text() {
        return this.editor ? this.editor.text() : this.initialText;
    }
    setAddCompletionsFromHistory(value) {
        this.addCompletionsFromHistory = value;
    }
    editorKeyDown(event) {
        if (!this.editor) {
            return;
        }
        const keyboardEvent = event;
        let newText;
        let isPrevious;
        // Check against visual coordinates in case lines wrap.
        const selection = this.editor.selection();
        const cursorY = this.editor.visualCoordinates(selection.endLine, selection.endColumn).y;
        switch (keyboardEvent.keyCode) {
            case UI.KeyboardShortcut.Keys.Up.code: {
                const startY = this.editor.visualCoordinates(0, 0).y;
                if (keyboardEvent.shiftKey || !selection.isEmpty() || cursorY !== startY) {
                    break;
                }
                newText = this.historyInternal.previous(this.text());
                isPrevious = true;
                break;
            }
            case UI.KeyboardShortcut.Keys.Down.code: {
                const fullRange = this.editor.fullRange();
                const endY = this.editor.visualCoordinates(fullRange.endLine, fullRange.endColumn).y;
                if (keyboardEvent.shiftKey || !selection.isEmpty() || cursorY !== endY) {
                    break;
                }
                newText = this.historyInternal.next();
                break;
            }
            case UI.KeyboardShortcut.Keys.P.code: { // Ctrl+P = Previous
                if (Host.Platform.isMac() && keyboardEvent.ctrlKey && !keyboardEvent.metaKey && !keyboardEvent.altKey &&
                    !keyboardEvent.shiftKey) {
                    newText = this.historyInternal.previous(this.text());
                    isPrevious = true;
                }
                break;
            }
            case UI.KeyboardShortcut.Keys.N.code: { // Ctrl+N = Next
                if (Host.Platform.isMac() && keyboardEvent.ctrlKey && !keyboardEvent.metaKey && !keyboardEvent.altKey &&
                    !keyboardEvent.shiftKey) {
                    newText = this.historyInternal.next();
                }
                break;
            }
            case UI.KeyboardShortcut.Keys.Enter.code: {
                this.enterKeyPressed(keyboardEvent);
                break;
            }
            case UI.KeyboardShortcut.Keys.Tab.code: {
                if (!this.text()) {
                    keyboardEvent.consume();
                }
                break;
            }
        }
        if (newText === undefined) {
            return;
        }
        keyboardEvent.consume(true);
        this.setText(newText);
        if (isPrevious) {
            this.editor.setSelection(TextUtils.TextRange.TextRange.createFromLocation(0, Infinity));
        }
        else {
            this.moveCaretToEndOfPrompt();
        }
    }
    async enterWillEvaluate() {
        if (!this.isCaretAtEndOfPrompt()) {
            return true;
        }
        return await ObjectUI.JavaScriptAutocomplete.JavaScriptAutocomplete.isExpressionComplete(this.text());
    }
    updatePromptIcon() {
        this.iconThrottler.schedule(async () => {
            const canComplete = await this.enterWillEvaluate();
            this.promptIcon.classList.toggle('console-prompt-incomplete', !canComplete);
        });
    }
    async enterKeyPressed(event) {
        if (event.altKey || event.ctrlKey || event.shiftKey) {
            return;
        }
        event.consume(true);
        // Since we prevent default, manually emulate the native "scroll on key input" behavior.
        this.element.scrollIntoView();
        this.clearAutocomplete();
        const str = this.text();
        if (!str.length) {
            return;
        }
        if (await this.enterWillEvaluate()) {
            await this.appendCommand(str, true);
        }
        else if (this.editor) {
            this.editor.newlineAndIndent();
        }
        this.enterProcessedForTest();
    }
    async appendCommand(text, useCommandLineAPI) {
        this.setText('');
        const currentExecutionContext = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
        if (currentExecutionContext) {
            const executionContext = currentExecutionContext;
            const message = SDK.ConsoleModel.ConsoleModel.instance().addCommandMessage(executionContext, text);
            const expression = ObjectUI.JavaScriptREPL.JavaScriptREPL.preprocessExpression(text);
            SDK.ConsoleModel.ConsoleModel.instance().evaluateCommandInConsole(executionContext, message, expression, useCommandLineAPI);
            if (ConsolePanel.instance().isShowing()) {
                Host.userMetrics.actionTaken(Host.UserMetrics.Action.CommandEvaluatedInConsolePanel);
            }
        }
    }
    enterProcessedForTest() {
    }
    historyCompletions(prefix, force) {
        const text = this.text();
        if (!this.addCompletionsFromHistory || !this.isCaretAtEndOfPrompt() || (!text && !force)) {
            return [];
        }
        const result = [];
        const set = new Set();
        const data = this.historyInternal.historyData();
        for (let i = data.length - 1; i >= 0 && result.length < 50; --i) {
            const item = data[i];
            if (!item.startsWith(text)) {
                continue;
            }
            if (set.has(item)) {
                continue;
            }
            set.add(item);
            result.push({ text: item.substring(text.length - prefix.length), iconType: 'smallicon-text-prompt', isSecondary: true });
        }
        return result;
    }
    focus() {
        if (this.editor) {
            this.editor.widget().focus();
        }
        else {
            this.element.focus();
        }
    }
    async wordsWithQuery(queryRange, substituteRange, force) {
        if (!this.editor || !this.defaultAutocompleteConfig || !this.defaultAutocompleteConfig.suggestionsCallback) {
            return [];
        }
        const query = this.editor.text(queryRange);
        const words = await this.defaultAutocompleteConfig.suggestionsCallback(queryRange, substituteRange, force);
        const historyWords = this.historyCompletions(query, force);
        return words ? words.concat(historyWords) : historyWords;
    }
    editorSetForTest() {
    }
}
export class ConsoleHistoryManager {
    data;
    historyOffset;
    uncommittedIsTop;
    constructor() {
        this.data = [];
        /**
         * 1-based entry in the history stack.
         */
        this.historyOffset = 1;
    }
    historyData() {
        return this.data;
    }
    setHistoryData(data) {
        this.data = data.slice();
        this.historyOffset = 1;
    }
    /**
     * Pushes a committed text into the history.
     */
    pushHistoryItem(text) {
        if (this.uncommittedIsTop) {
            this.data.pop();
            delete this.uncommittedIsTop;
        }
        this.historyOffset = 1;
        if (text === this.currentHistoryItem()) {
            return;
        }
        this.data.push(text);
    }
    /**
     * Pushes the current (uncommitted) text into the history.
     */
    pushCurrentText(currentText) {
        if (this.uncommittedIsTop) {
            this.data.pop();
        } // Throw away obsolete uncommitted text.
        this.uncommittedIsTop = true;
        this.data.push(currentText);
    }
    previous(currentText) {
        if (this.historyOffset > this.data.length) {
            return undefined;
        }
        if (this.historyOffset === 1) {
            this.pushCurrentText(currentText);
        }
        ++this.historyOffset;
        return this.currentHistoryItem();
    }
    next() {
        if (this.historyOffset === 1) {
            return undefined;
        }
        --this.historyOffset;
        return this.currentHistoryItem();
    }
    currentHistoryItem() {
        return this.data[this.data.length - this.historyOffset];
    }
}
//# sourceMappingURL=ConsolePrompt.js.map