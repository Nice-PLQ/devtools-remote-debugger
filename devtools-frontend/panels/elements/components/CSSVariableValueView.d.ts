export declare class CSSVariableValueView extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    constructor(content: String);
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-css-variable-value-view': CSSVariableValueView;
    }
}
