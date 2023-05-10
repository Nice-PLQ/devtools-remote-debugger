export interface ComputedStylePropertyData {
    inherited: boolean;
    traceable: boolean;
    onNavigateToSource: (event?: Event) => void;
}
export declare class ComputedStyleProperty extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private inherited;
    private traceable;
    private onNavigateToSource;
    connectedCallback(): void;
    set data(data: ComputedStylePropertyData);
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-computed-style-property': ComputedStyleProperty;
    }
}
