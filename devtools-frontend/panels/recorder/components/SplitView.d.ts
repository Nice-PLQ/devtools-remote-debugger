import '../../../ui/legacy/legacy.js';
declare global {
    interface HTMLElementTagNameMap {
        'devtools-split-view': SplitView;
    }
}
export declare class SplitView extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
}
