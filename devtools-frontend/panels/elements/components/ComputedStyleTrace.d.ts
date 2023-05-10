export interface ComputedStyleTraceData {
    selector: string;
    active: boolean;
    onNavigateToSource: (event?: Event) => void;
}
export declare class ComputedStyleTrace extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private selector;
    private active;
    private onNavigateToSource;
    connectedCallback(): void;
    set data(data: ComputedStyleTraceData);
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-computed-style-trace': ComputedStyleTrace;
    }
}
