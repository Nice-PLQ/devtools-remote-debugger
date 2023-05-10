import * as Common from '../../../core/common/common.js';
export interface HiddenIssuesMenuData {
    menuItemLabel: Common.UIString.LocalizedString;
    menuItemAction: () => void;
}
export declare class HideIssuesMenu extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private visible;
    private menuItemLabel;
    private menuItemAction;
    set data(data: HiddenIssuesMenuData);
    connectedCallback(): void;
    setVisible(x: boolean): void;
    onMenuOpen(event: Event): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-hide-issues-menu': HideIssuesMenu;
    }
}
