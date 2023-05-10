export interface ElementsPanelLinkData {
    onElementRevealIconClick: (event?: Event) => void;
    onElementRevealIconMouseEnter: (event?: Event) => void;
    onElementRevealIconMouseLeave: (event?: Event) => void;
}
export declare class ElementsPanelLink extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private onElementRevealIconClick;
    private onElementRevealIconMouseEnter;
    private onElementRevealIconMouseLeave;
    set data(data: ElementsPanelLinkData);
    private update;
    connectedCallback(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-elements-panel-link': ElementsPanelLink;
    }
}
