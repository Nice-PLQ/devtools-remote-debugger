import type * as Platform from '../../core/platform/platform.js';
export declare class SoftContextMenu {
    private items;
    private itemSelectedCallback;
    private parentMenu;
    private highlightedMenuItemElement;
    detailsForElementMap: WeakMap<HTMLElement, ElementMenuDetails>;
    private document?;
    private glassPane?;
    private contextMenuElement?;
    private focusRestorer?;
    private hideOnUserMouseDownUnlessInMenu?;
    private activeSubMenuElement?;
    private subMenu?;
    private onMenuClosed?;
    private focusOnTheFirstItem;
    constructor(items: SoftContextMenuDescriptor[], itemSelectedCallback: (arg0: number) => void, parentMenu?: SoftContextMenu, onMenuClosed?: () => void);
    show(document: Document, anchorBox: AnchorBox): void;
    setContextMenuElementLabel(label: string): void;
    discard(): void;
    private createMenuItem;
    private createSubMenu;
    private createSeparator;
    private menuItemMouseDown;
    private menuItemMouseUp;
    private root;
    private triggerAction;
    private showSubMenu;
    private menuItemMouseOver;
    private menuItemMouseLeave;
    private highlightMenuItem;
    private highlightPrevious;
    private highlightNext;
    private menuKeyDown;
    markAsMenuItemCheckBox(): void;
    setFocusOnTheFirstItem(focusOnTheFirstItem: boolean): void;
}
export interface SoftContextMenuDescriptor {
    type: 'checkbox' | 'item' | 'separator' | 'subMenu';
    id?: number;
    label?: string;
    enabled?: boolean;
    checked?: boolean;
    subItems?: SoftContextMenuDescriptor[];
    element?: Element;
    shortcut?: string;
    tooltip?: Platform.UIString.LocalizedString;
}
interface ElementMenuDetails {
    customElement?: HTMLElement;
    isSeparator?: boolean;
    subMenuTimer?: number;
    subItems?: SoftContextMenuDescriptor[];
    actionId?: number;
}
export {};
