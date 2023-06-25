export declare class ColorMixSwatch extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../lit-html/static.js").Static;
    private readonly shadow;
    private colorMixText;
    private firstColorText;
    private secondColorText;
    constructor();
    setFirstColor(text: string): void;
    setSecondColor(text: string): void;
    setColorMixText(text: string): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-color-mix-swatch': ColorMixSwatch;
    }
}
