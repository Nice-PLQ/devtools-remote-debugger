import type * as Common from '../../../core/common/common.js';
export interface SettingCheckboxData {
    setting: Common.Settings.Setting<boolean>;
    /**
     * If set to true, the checkbox is disabled and not clickable by the user.
     * The checkbox will still reflect the current value of the setting (i.e. checked/unchecked).
     */
    disabled?: boolean;
}
/**
 * A simple checkbox that is backed by a boolean setting.
 */
export declare class SettingCheckbox extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private setting?;
    private disabled;
    private changeListenerDescriptor?;
    connectedCallback(): void;
    set data(data: SettingCheckboxData);
    private render;
    private checkboxChanged;
}
declare global {
    interface HTMLElementTagNameMap {
        'setting-checkbox': SettingCheckbox;
    }
}
