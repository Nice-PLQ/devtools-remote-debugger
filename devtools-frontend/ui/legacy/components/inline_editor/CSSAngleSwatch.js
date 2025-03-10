// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Lit from '../../../lit/lit.js';
import cssAngleSwatchStylesRaw from './cssAngleSwatch.css.js';
import { get2DTranslationsForAngle } from './CSSAngleUtils.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const cssAngleSwatchStyles = new CSSStyleSheet();
cssAngleSwatchStyles.replaceSync(cssAngleSwatchStylesRaw.cssContent);
const { render, html } = Lit;
const styleMap = Lit.Directives.styleMap;
const swatchWidth = 11;
export class CSSAngleSwatch extends HTMLElement {
    shadow = this.attachShadow({ mode: 'open' });
    angle = {
        value: 0,
        unit: "rad" /* AngleUnit.RAD */,
    };
    connectedCallback() {
        this.shadow.adoptedStyleSheets = [cssAngleSwatchStyles];
    }
    set data(data) {
        this.angle = data.angle;
        this.render();
    }
    render() {
        const { translateX, translateY } = get2DTranslationsForAngle(this.angle, swatchWidth / 4);
        const miniHandStyle = {
            transform: `translate(${translateX}px, ${translateY}px) rotate(${this.angle.value}${this.angle.unit})`,
        };
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="swatch">
        <span class="mini-hand" style=${styleMap(miniHandStyle)}></span>
      </div>
    `, this.shadow, {
            host: this,
        });
        // clang-format on
    }
}
customElements.define('devtools-css-angle-swatch', CSSAngleSwatch);
//# sourceMappingURL=CSSAngleSwatch.js.map