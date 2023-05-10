import type { ContextMenu, Provider } from './ContextMenu.js';
import { XElement } from './XElement.js';
export declare class XLink extends XElement {
    tabIndex: number;
    target: string;
    rel: string;
    hrefInternal: string | null;
    private clickable;
    private readonly onClick;
    private readonly onKeyDown;
    static create(url: string, linkText?: string, className?: string, preventClick?: boolean): HTMLElement;
    constructor();
    static get observedAttributes(): string[];
    get href(): string | null;
    attributeChangedCallback(attr: string, oldValue: string | null, newValue: string | null): void;
    private updateClick;
}
export declare class ContextMenuProvider implements Provider {
    static instance(opts?: {
        forceNew: boolean | null;
    }): ContextMenuProvider;
    appendApplicableItems(event: Event, contextMenu: ContextMenu, target: Object): void;
}
