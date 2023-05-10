declare global {
    interface HTMLElementTagNameMap {
        'devtools-button': Button;
    }
}
export declare const enum Variant {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    TOOLBAR = "toolbar"
}
export declare const enum Size {
    SMALL = "SMALL",
    MEDIUM = "MEDIUM"
}
export declare type ButtonData = {
    variant: Variant.TOOLBAR;
    iconUrl: string;
    size?: Size;
    disabled?: boolean;
} | {
    variant: Variant.PRIMARY | Variant.SECONDARY;
    iconUrl?: string;
    size?: Size;
    disabled?: boolean;
};
export declare class Button extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private readonly boundRender;
    private readonly boundOnClick;
    private readonly props;
    private isEmpty;
    constructor();
    /**
     * Perfer using the .data= setter instead of setting the individual properties
     * for increased type-safety.
     */
    set data(data: ButtonData);
    set iconUrl(iconUrl: string | undefined);
    set variant(variant: Variant);
    set size(size: Size);
    set disabled(disabled: boolean);
    private setDisabledProperty;
    focus(): void;
    connectedCallback(): void;
    private onClick;
    private onSlotChange;
    private render;
}
