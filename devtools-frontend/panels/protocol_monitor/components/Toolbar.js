var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../recorder/components/components.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import editorWidgetStyles from './JSONEditor.css.js';
import toolbarStyles from './toolbar.css.js';
const { html, Decorators, LitElement } = LitHtml;
const { customElement } = Decorators;
const copyIconUrl = new URL('../../../Images/copy.svg', import.meta.url).toString();
const sendIconUrl = new URL('../../../Images/send.svg', import.meta.url).toString();
export let Toolbar = class Toolbar extends LitElement {
    static styles = [toolbarStyles, editorWidgetStyles];
    #handleCopy = () => {
        this.dispatchEvent(new CustomEvent('copycommand', { bubbles: true }));
    };
    #handleSend = () => {
        this.dispatchEvent(new CustomEvent('commandsent', { bubbles: true }));
    };
    render() {
        // clang-format off
        return html `
        <div class="toolbar">
          <${Buttons.Button.Button.litTagName}
          .size=${"MEDIUM" /* Buttons.Button.Size.MEDIUM */}
          .iconUrl=${copyIconUrl}
          .variant=${"toolbar" /* Buttons.Button.Variant.TOOLBAR */}
          @click=${this.#handleCopy}
        ></${Buttons.Button.Button.litTagName}>
        <${Buttons.Button.Button.litTagName}
          .size=${"SMALL" /* Buttons.Button.Size.SMALL */}
          .iconUrl=${sendIconUrl}
          .variant=${"primary_toolbar" /* Buttons.Button.Variant.PRIMARY_TOOLBAR */}
          @click=${this.#handleSend}
        ></${Buttons.Button.Button.litTagName}>
      </div>
    `;
        // clang-format on
    }
};
Toolbar = __decorate([
    customElement('devtools-pm-toolbar')
], Toolbar);
//# sourceMappingURL=Toolbar.js.map