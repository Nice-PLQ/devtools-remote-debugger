interface BaseLinkSwatchRenderData {
    text: string;
    title: string;
    showTitle: boolean;
    isDefined: boolean;
    onLinkActivate: (linkText: string) => void;
}
declare class BaseLinkSwatch extends HTMLElement {
    static readonly litTagName: import("../../../lit-html/static.js").Static;
    protected readonly shadow: ShadowRoot;
    protected onLinkActivate: (linkText: string, event: MouseEvent | KeyboardEvent) => void;
    connectedCallback(): void;
    set data(data: BaseLinkSwatchRenderData);
    private render;
}
interface CSSVarSwatchRenderData {
    text: string;
    computedValue: string | null;
    fromFallback: boolean;
    onLinkActivate: (linkText: string) => void;
}
export declare class CSSVarSwatch extends HTMLElement {
    static readonly litTagName: import("../../../lit-html/static.js").Static;
    protected readonly shadow: ShadowRoot;
    constructor();
    set data(data: CSSVarSwatchRenderData);
    private parseVariableFunctionParts;
    private variableName;
    protected render(data: CSSVarSwatchRenderData): void;
}
interface LinkSwatchRenderData {
    isDefined: boolean;
    text: string;
    onLinkActivate: (linkText: string) => void;
}
export declare class LinkSwatch extends HTMLElement {
    static readonly litTagName: import("../../../lit-html/static.js").Static;
    protected readonly shadow: ShadowRoot;
    set data(data: LinkSwatchRenderData);
    protected render(data: LinkSwatchRenderData): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-base-link-swatch': BaseLinkSwatch;
        'devtools-link-swatch': LinkSwatch;
        'devtools-css-var-swatch': CSSVarSwatch;
    }
}
export {};
