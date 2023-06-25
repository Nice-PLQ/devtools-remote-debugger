// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as CodeHighlighter from '../../../ui/components/code_highlighter/code_highlighter.js';
// eslint-disable-next-line rulesdir/es_modules_import
import codeHighlighterStyles from '../../../ui/components/code_highlighter/codeHighlighter.css.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import contentEditableStyles from './recorderInput.css.js';
import { assert, mod } from './util.js';
const { html, Decorators, Directives, LitElement } = LitHtml;
const { customElement, property, state } = Decorators;
const { classMap } = Directives;
const jsonPropertyOptions = {
    hasChanged(value, oldValue) {
        return JSON.stringify(value) !== JSON.stringify(oldValue);
    },
};
let EditableContent = class EditableContent extends HTMLElement {
    static get observedAttributes() {
        return ['disabled', 'placeholder'];
    }
    set disabled(disabled) {
        this.contentEditable = String(!disabled);
    }
    get disabled() {
        return this.contentEditable !== 'true';
    }
    set value(value) {
        this.innerText = value;
        this.#highlight();
    }
    get value() {
        return this.innerText;
    }
    set mimeType(type) {
        this.#mimeType = type;
        this.#highlight();
    }
    get mimeType() {
        return this.#mimeType;
    }
    #mimeType = '';
    constructor() {
        super();
        this.contentEditable = 'true';
        this.tabIndex = 0;
        this.addEventListener('focus', () => {
            this.innerHTML = this.innerText;
        });
        this.addEventListener('blur', this.#highlight.bind(this));
    }
    #highlight() {
        if (this.#mimeType) {
            void CodeHighlighter.CodeHighlighter.highlightNode(this, this.#mimeType);
        }
    }
    attributeChangedCallback(name, _, value) {
        switch (name) {
            case 'disabled':
                this.disabled = value !== null;
                break;
        }
    }
};
EditableContent = __decorate([
    customElement('devtools-editable-content')
], EditableContent);
/**
 * Contains a suggestion emitted due to action by the user.
 */
class SuggestEvent extends Event {
    static eventName = 'suggest';
    constructor(suggestion) {
        super(SuggestEvent.eventName);
        this.suggestion = suggestion;
    }
}
/**
 * Parents should listen for this event and register the listeners provided by
 * this event.
 */
class SuggestionInitEvent extends Event {
    static eventName = 'suggestioninit';
    listeners;
    constructor(listeners) {
        super(SuggestionInitEvent.eventName);
        this.listeners = listeners;
    }
}
/**
 * @fires SuggestionInitEvent#suggestioninit
 * @fires SuggestEvent#suggest
 */
let SuggestionBox = class SuggestionBox extends LitElement {
    static styles = [contentEditableStyles];
    #suggestions = [];
    constructor() {
        super();
        this.options = [];
        this.expression = '';
        this.cursor = 0;
    }
    #handleKeyDownEvent = (event) => {
        assert(event instanceof KeyboardEvent, 'Bound to the wrong event.');
        if (this.#suggestions.length > 0) {
            switch (event.key) {
                case 'ArrowDown':
                    event.stopPropagation();
                    event.preventDefault();
                    this.#moveCursor(1);
                    break;
                case 'ArrowUp':
                    event.stopPropagation();
                    event.preventDefault();
                    this.#moveCursor(-1);
                    break;
            }
        }
        switch (event.key) {
            case 'Enter':
                if (this.#suggestions[this.cursor]) {
                    this.#dispatchSuggestEvent(this.#suggestions[this.cursor]);
                }
                event.preventDefault();
                break;
        }
    };
    #moveCursor(delta) {
        this.cursor = mod(this.cursor + delta, this.#suggestions.length);
    }
    #dispatchSuggestEvent(suggestion) {
        this.dispatchEvent(new SuggestEvent(suggestion));
    }
    connectedCallback() {
        super.connectedCallback();
        this.dispatchEvent(new SuggestionInitEvent([['keydown', this.#handleKeyDownEvent]]));
    }
    willUpdate(changedProperties) {
        if (changedProperties.has('options')) {
            this.options = Object.freeze([...this.options].sort());
        }
        if (changedProperties.has('expression')) {
            this.cursor = 0;
            this.#suggestions = this.options.filter(option => option.startsWith(this.expression));
        }
    }
    render() {
        if (this.#suggestions.length === 0) {
            return;
        }
        return html `<ul class="suggestions">
      ${this.#suggestions.map((suggestion, index) => {
            return html `<li
          class=${classMap({
                selected: index === this.cursor,
            })}
          @mousedown=${this.#dispatchSuggestEvent.bind(this, suggestion)}
        >
          ${suggestion}
        </li>`;
        })}
    </ul>`;
    }
};
__decorate([
    property(jsonPropertyOptions)
], SuggestionBox.prototype, "options", void 0);
__decorate([
    property()
], SuggestionBox.prototype, "expression", void 0);
__decorate([
    state()
], SuggestionBox.prototype, "cursor", void 0);
SuggestionBox = __decorate([
    customElement('devtools-suggestion-box')
], SuggestionBox);
export let RecorderInput = class RecorderInput extends LitElement {
    static shadowRootOptions = {
        ...LitElement.shadowRootOptions,
        delegatesFocus: true,
    };
    static styles = [contentEditableStyles, codeHighlighterStyles];
    constructor() {
        super();
        this.options = [];
        this.expression = '';
        this.placeholder = '';
        this.value = '';
        this.disabled = false;
        this.mimeType = '';
        this.addEventListener('blur', this.#handleBlurEvent);
    }
    #cachedEditableContent;
    get #editableContent() {
        if (this.#cachedEditableContent) {
            return this.#cachedEditableContent;
        }
        const node = this.renderRoot.querySelector('devtools-editable-content');
        if (!node) {
            throw new Error('Attempted to query node before rendering.');
        }
        this.#cachedEditableContent = node;
        return node;
    }
    #handleBlurEvent = () => {
        window.getSelection()?.removeAllRanges();
        this.value = this.#editableContent.value;
        this.expression = this.#editableContent.value;
    };
    #handleFocusEvent = (event) => {
        assert(event.target instanceof Node);
        const range = document.createRange();
        range.selectNodeContents(event.target);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    };
    #handleKeyDownEvent = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
        }
    };
    #handleInputEvent = (event) => {
        this.expression = event.target.value;
    };
    #handleSuggestionInitEvent = (event) => {
        for (const [name, listener] of event.listeners) {
            this.addEventListener(name, listener);
        }
    };
    #handleSuggestEvent = (event) => {
        this.#editableContent.value = event.suggestion;
        // If actions result in a `focus` after this blur, then the blur won't
        // happen. `setTimeout` guarantees `blur` will always come after `focus`.
        setTimeout(this.blur.bind(this), 0);
    };
    willUpdate(properties) {
        if (properties.has('value')) {
            this.expression = this.value;
        }
    }
    render() {
        return html `<devtools-editable-content
        ?disabled=${this.disabled}
        .enterKeyHint=${'done'}
        .value=${this.value}
        .mimeType=${this.mimeType}
        @focus=${this.#handleFocusEvent}
        @input=${this.#handleInputEvent}
        @keydown=${this.#handleKeyDownEvent}
        autocapitalize="off"
        inputmode="text"
        placeholder=${this.placeholder}
        spellcheck="false"
      ></devtools-editable-content>
      <devtools-suggestion-box
        @suggestioninit=${this.#handleSuggestionInitEvent}
        @suggest=${this.#handleSuggestEvent}
        .options=${this.options}
        .expression=${this.expression}
      ></devtools-suggestion-box>`;
    }
};
__decorate([
    property(jsonPropertyOptions)
], RecorderInput.prototype, "options", void 0);
__decorate([
    state()
], RecorderInput.prototype, "expression", void 0);
__decorate([
    property()
], RecorderInput.prototype, "placeholder", void 0);
__decorate([
    property()
], RecorderInput.prototype, "value", void 0);
__decorate([
    property({ type: Boolean })
], RecorderInput.prototype, "disabled", void 0);
__decorate([
    property()
], RecorderInput.prototype, "mimeType", void 0);
RecorderInput = __decorate([
    customElement('devtools-recorder-input')
], RecorderInput);
//# sourceMappingURL=RecorderInput.js.map