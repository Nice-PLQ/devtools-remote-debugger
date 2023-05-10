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
    private hideOnUserGesture?;
    private activeSubMenuElement?;
    private subMenu?;
    constructor(items: SoftContextMenuDescriptor[], itemSelectedCallback: (arg0: number) => void, parentMenu?: SoftContextMenu);
    show(document: Document, anchorBox: AnchorBox): void;
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
}
export interface SoftContextMenuDescriptor {
    type: string;
    id?: number;
    label?: string;
    enabled?: boolean;
    checked?: boolean;
    subItems?: SoftContextMenuDescriptor[];
    element?: Element;
    shortcut?: string;
}
interface ElementMenuDetails {
    customElement?: HTMLElement;
    isSeparator?: boolean;
    subMenuTimer?: number;
    subItems?: SoftContextMenuDescriptor[];
    actionId?: number;
}
export {};
