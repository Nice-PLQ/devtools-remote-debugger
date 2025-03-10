// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../ui/components/menus/menus.js';
import * as Platform from '../../../core/platform/platform.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as Dialogs from '../../../ui/components/dialogs/dialogs.js';
import * as ComponentHelpers from '../../../ui/components/helpers/helpers.js';
import * as Lit from '../../../ui/lit/lit.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';
import * as Models from '../models/models.js';
import selectButtonStylesRaw from './selectButton.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const selectButtonStyles = new CSSStyleSheet();
selectButtonStyles.replaceSync(selectButtonStylesRaw.cssContent);
const { html, Directives: { ifDefined, classMap } } = Lit;
export class SelectButtonClickEvent extends Event {
    value;
    static eventName = 'selectbuttonclick';
    constructor(value) {
        super(SelectButtonClickEvent.eventName, { bubbles: true, composed: true });
        this.value = value;
    }
}
export class SelectMenuSelectedEvent extends Event {
    value;
    static eventName = 'selectmenuselected';
    constructor(value) {
        super(SelectMenuSelectedEvent.eventName, { bubbles: true, composed: true });
        this.value = value;
    }
}
export class SelectButton extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #props = {
        disabled: false,
        value: '',
        items: [],
        buttonLabel: '',
        groups: [],
        variant: "primary" /* Variant.PRIMARY */,
    };
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [selectButtonStyles];
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    get disabled() {
        return this.#props.disabled;
    }
    set disabled(disabled) {
        this.#props.disabled = disabled;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    get items() {
        return this.#props.items;
    }
    set items(items) {
        this.#props.items = items;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    set buttonLabel(buttonLabel) {
        this.#props.buttonLabel = buttonLabel;
    }
    set groups(groups) {
        this.#props.groups = groups;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    get value() {
        return this.#props.value;
    }
    set value(value) {
        this.#props.value = value;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    get variant() {
        return this.#props.variant;
    }
    set variant(variant) {
        this.#props.variant = variant;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    set action(value) {
        this.#props.action = value;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    #handleClick(ev) {
        ev.stopPropagation();
        this.dispatchEvent(new SelectButtonClickEvent(this.#props.value));
    }
    #handleSelectMenuSelect(evt) {
        this.dispatchEvent(new SelectMenuSelectedEvent(evt.itemValue));
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
    #renderSelectItem(item, selectedItem) {
        // clang-format off
        return html `
      <devtools-menu-item
      .title=${item.label()}
      .value=${item.value}
      .selected=${item.value === selectedItem.value}
      jslog=${VisualLogging.item(Platform.StringUtilities.toKebabCase(item.value)).track({ click: true })}
      >${item.label()}</devtools-menu-item>
    `;
        // clang-format on
    }
    #renderSelectGroup(group, selectedItem) {
        // clang-format off
        return html `
      <devtools-menu-group .name=${group.name}>
        ${group.items.map(item => this.#renderSelectItem(item, selectedItem))}
      </devtools-menu-group>
    `;
        // clang-format on
    }
    #getTitle(label) {
        return this.#props.action ? Models.Tooltip.getTooltipForActions(label, this.#props.action) : '';
    }
    #render = () => {
        const hasGroups = Boolean(this.#props.groups.length);
        const items = hasGroups ? this.#props.groups.flatMap(group => group.items) : this.#props.items;
        const selectedItem = items.find(item => item.value === this.#props.value) || items[0];
        if (!selectedItem) {
            return;
        }
        const classes = {
            primary: this.#props.variant === "primary" /* Variant.PRIMARY */,
            secondary: this.#props.variant === "outlined" /* Variant.OUTLINED */,
        };
        const buttonVariant = this.#props.variant === "outlined" /* Variant.OUTLINED */ ? "outlined" /* Buttons.Button.Variant.OUTLINED */ : "primary" /* Buttons.Button.Variant.PRIMARY */;
        const menuLabel = selectedItem.buttonLabel ? selectedItem.buttonLabel() : selectedItem.label();
        // clang-format off
        Lit.render(html `
      <div class="select-button" title=${ifDefined(this.#getTitle(menuLabel))}>
      <devtools-select-menu
          title=""
          class=${classMap(classes)}
          @selectmenuselected=${this.#handleSelectMenuSelect}
          ?disabled=${this.#props.disabled}
          .showArrow=${true}
          .sideButton=${false}
          .showSelectedItem=${true}
          .disabled=${this.#props.disabled}
          .buttonTitle=${() => html `${menuLabel}`}
          .position=${"bottom" /* Dialogs.Dialog.DialogVerticalPosition.BOTTOM */}
          .horizontalAlignment=${"right" /* Dialogs.Dialog.DialogHorizontalAlignment.RIGHT */}
        >
          ${hasGroups
            ? this.#props.groups.map(group => this.#renderSelectGroup(group, selectedItem))
            : this.#props.items.map(item => this.#renderSelectItem(item, selectedItem))}
        </devtools-select-menu>
        ${selectedItem
            ? html `
        <devtools-button
            .disabled=${this.#props.disabled}
            .variant=${buttonVariant}
            .iconName=${selectedItem.buttonIconName}
            @click=${this.#handleClick}>
            ${this.#props.buttonLabel}
        </devtools-button>`
            : ''}
      </div>`, this.#shadow, { host: this });
        // clang-format on
    };
}
customElements.define('devtools-select-button', SelectButton);
//# sourceMappingURL=SelectButton.js.map