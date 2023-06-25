// Copyright (c) 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';
import iconStyles from './newIcon.css.js';
export class NewIcon extends LitHtml.LitElement {
    name = '';
    static get styles() {
        return [iconStyles];
    }
    render() {
        const path = this.pathFromName(this.name);
        const styles = { webkitMaskImage: `url(${path})` };
        return LitHtml.html `<span style=${LitHtml.Directives.styleMap(styles)}></span>`;
    }
    pathFromName(name) {
        return new URL(`../../../Images/${name}.svg`, import.meta.url).toString();
    }
}
__decorate([
    LitHtml
        .Decorators.property({
        type: String,
    })
], NewIcon.prototype, "name", void 0);
ComponentHelpers.CustomElements.defineComponent('devtools-new-icon', NewIcon);
//# sourceMappingURL=NewIcon.js.map