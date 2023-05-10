// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../core/common/common.js';
import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
import * as LitHtml from '../../lit-html/lit-html.js';
import * as CodeHighlighter from '../code_highlighter/code_highlighter.js';
import * as ComponentHelpers from '../helpers/helpers.js';
import { baseConfiguration, dynamicSetting } from './config.js';
export class TextEditor extends HTMLElement {
    static litTagName = LitHtml.literal `devtools-text-editor`;
    shadow = this.attachShadow({ mode: 'open' });
    activeEditor = undefined;
    activeSettingListeners = [];
    pendingState;
    constructor(pendingState) {
        super();
        this.pendingState = pendingState;
        this.shadow.adoptedStyleSheets = [CodeHighlighter.Style.default];
    }
    createEditor() {
        this.activeEditor = new CodeMirror.EditorView({
            state: this.updateDynamicSettings(this.state),
            parent: this.shadow,
            root: this.shadow,
        });
        return this.activeEditor;
    }
    get editor() {
        return this.activeEditor || this.createEditor();
    }
    get state() {
        if (this.activeEditor) {
            return this.activeEditor.state;
        }
        if (!this.pendingState) {
            this.pendingState = CodeMirror.EditorState.create({ extensions: baseConfiguration('') });
        }
        return this.pendingState;
    }
    set state(state) {
        if (this.activeEditor) {
            this.activeEditor.setState(state);
        }
        else {
            this.pendingState = state;
        }
    }
    connectedCallback() {
        if (!this.activeEditor) {
            this.createEditor();
        }
        this.registerSettingHandlers();
    }
    disconnectedCallback() {
        if (this.activeEditor) {
            this.pendingState = this.activeEditor.state;
            this.activeEditor.destroy();
            this.activeEditor = undefined;
        }
        for (const [setting, listener] of this.activeSettingListeners) {
            setting.removeChangeListener(listener);
        }
        this.activeSettingListeners = [];
    }
    updateDynamicSettings(state) {
        const settings = Common.Settings.Settings.instance();
        const changes = [];
        for (const opt of state.facet(dynamicSetting)) {
            const mustUpdate = opt.sync(state, settings.moduleSetting(opt.settingName).get());
            if (mustUpdate) {
                changes.push(mustUpdate);
            }
        }
        return changes.length ? state.update({ effects: changes }).state : state;
    }
    registerSettingHandlers() {
        const settings = Common.Settings.Settings.instance();
        for (const opt of this.state.facet(dynamicSetting)) {
            const handler = ({ data }) => {
                const change = opt.sync(this.state, data);
                if (change && this.activeEditor) {
                    this.activeEditor.dispatch({ effects: change });
                }
            };
            const setting = settings.moduleSetting(opt.settingName);
            setting.addChangeListener(handler);
            this.activeSettingListeners.push([setting, handler]);
        }
    }
    revealPosition(position) {
        const view = this.activeEditor;
        if (!view) {
            return;
        }
        const line = view.state.doc.lineAt(position);
        view.dispatch({
            selection: CodeMirror.EditorSelection.cursor(position),
            scrollIntoView: true,
            effects: [view.state.field(highlightState, false) ?
                    setHighlightLine.of(line.from) :
                    CodeMirror.StateEffect.appendConfig.of(highlightState.init(() => highlightDeco(line.from)))],
        });
        const { id } = view.state.field(highlightState);
        // Reset the highlight state if, after 2 seconds (the animation
        // duration) it is still showing this highlight.
        setTimeout(() => {
            if (view.state.field(highlightState).id === id) {
                view.dispatch({ effects: setHighlightLine.of(null) });
            }
        }, 2000);
    }
}
ComponentHelpers.CustomElements.defineComponent('devtools-text-editor', TextEditor);
const setHighlightLine = CodeMirror.StateEffect.define({ map: (value, mapping) => value === null ? null : mapping.mapPos(value) });
function highlightDeco(position) {
    const deco = CodeMirror.Decoration.set([CodeMirror.Decoration.line({ attributes: { class: 'cm-highlightedLine' } }).range(position)]);
    return { deco, id: Math.floor(Math.random() * 0xfffff) };
}
const highlightState = CodeMirror.StateField.define({
    create: () => ({ deco: CodeMirror.Decoration.none, id: 0 }),
    update(value, tr) {
        if (!tr.changes.empty && value.deco.size) {
            value = { deco: value.deco.map(tr.changes), id: value.id };
        }
        for (const effect of tr.effects) {
            if (effect.is(setHighlightLine)) {
                value = effect.value === null ? { deco: CodeMirror.Decoration.none, id: 0 } : highlightDeco(effect.value);
            }
        }
        return value;
    },
    provide: field => CodeMirror.EditorView.decorations.from(field, value => value.deco),
});
//# sourceMappingURL=TextEditor.js.map