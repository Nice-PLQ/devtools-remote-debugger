export interface LinkifierData {
    url: string;
    lineNumber?: number;
    columnNumber?: number;
}
export declare class LinkifierClick extends Event {
    data: LinkifierData;
    static readonly eventName = "linkifieractivated";
    constructor(data: LinkifierData);
}
export declare class Linkifier extends HTMLElement {
    #private;
    static readonly litTagName: import("../../lit-html/static.js").Static;
    set data(data: LinkifierData);
    connectedCallback(): void;
    private onLinkActivation;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-linkifier': Linkifier;
    }
}
