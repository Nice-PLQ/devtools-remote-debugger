export declare const i18nString: (id: string, values?: import("../../../core/i18n/i18nTypes.js").Values | undefined) => import("../../../core/platform/UIString.js").LocalizedString;
export declare class EndpointsGrid extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    connectedCallback(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-endpoints-grid': EndpointsGrid;
    }
}
