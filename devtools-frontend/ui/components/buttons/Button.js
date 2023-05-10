// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as LitHtml from '../../lit-html/lit-html.js';
import * as ComponentHelpers from '../helpers/helpers.js';
import * as IconButton from '../icon_button/icon_button.js';
import buttonStyles from './button.css.js';
export class Button extends HTMLElement {
    static litTagName = LitHtml.literal `devtools-button`;
    shadow = this.attachShadow({ mode: 'open', delegatesFocus: true });
    boundRender = this.render.bind(this);
    boundOnClick = this.onClick.bind(this);
    props = {
        size: "MEDIUM" /* MEDIUM */,
        disabled: false,
    };
    isEmpty = true;
    constructor() {
        super();
        this.setAttribute('role', 'presentation');
        this.addEventListener('click', this.boundOnClick, true);
    }
    /**
     * Perfer using the .data= setter instead of setting the individual properties
     * for increased type-safety.
     */
    set data(data) {
        this.props.variant = data.variant;
        this.props.iconUrl = data.iconUrl;
        this.props.size = data.size || "MEDIUM" /* MEDIUM */;
        this.setDisabledProperty(data.disabled || false);
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    set iconUrl(iconUrl) {
        this.props.iconUrl = iconUrl;
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    set variant(variant) {
        this.props.variant = variant;
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    set size(size) {
        this.props.size = size;
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    set disabled(disabled) {
        this.setDisabledProperty(disabled);
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    setDisabledProperty(disabled) {
        this.props.disabled = disabled;
        this.toggleAttribute('disabled', disabled);
    }
    focus() {
        this.shadow.querySelector('button')?.focus();
    }
    connectedCallback() {
        this.shadow.adoptedStyleSheets = [buttonStyles];
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    onClick(event) {
        if (this.props.disabled) {
            event.stopPropagation();
            event.preventDefault();
        }
    }
    onSlotChange(event) {
        const slot = event.target;
        const nodes = slot?.assignedNodes();
        this.isEmpty = !nodes || !Boolean(nodes.length);
        ComponentHelpers.ScheduledRender.scheduleRender(this, this.boundRender);
    }
    render() {
        if (!this.props.variant) {
            throw new Error('Button requires a variant to be defined');
        }
        if (this.props.variant === "toolbar" /* TOOLBAR */) {
            if (!this.props.iconUrl) {
                throw new Error('Toolbar button requires an icon');
            }
            if (!this.isEmpty) {
                throw new Error('Tooblar button does not accept children');
            }
        }
        const classes = {
            primary: this.props.variant === "primary" /* PRIMARY */,
            secondary: this.props.variant === "secondary" /* SECONDARY */,
            toolbar: this.props.variant === "toolbar" /* TOOLBAR */,
            'text-with-icon': Boolean(this.props.iconUrl) && !this.isEmpty,
            'only-icon': Boolean(this.props.iconUrl) && this.isEmpty,
            small: Boolean(this.props.size === "SMALL" /* SMALL */),
        };
        // clang-format off
        LitHtml.render(LitHtml.html `
        <button .disabled=${this.props.disabled} class=${LitHtml.Directives.classMap(classes)}>
          ${this.props.iconUrl ? LitHtml.html `<${IconButton.Icon.Icon.litTagName}
            .data=${{
            iconPath: this.props.iconUrl,
            color: 'var(--color-background)',
        }}
          >
          </${IconButton.Icon.Icon.litTagName}>` : ''}
          <slot @slotchange=${this.onSlotChange}></slot>
        </button>
      `, this.shadow, { host: this });
        // clang-format on
    }
}
ComponentHelpers.CustomElements.defineComponent('devtools-button', Button);
//# sourceMappingURL=Button.js.map