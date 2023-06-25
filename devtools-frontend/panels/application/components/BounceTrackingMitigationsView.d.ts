export declare const i18nString: (id: string, values?: import("../../../core/i18n/i18nTypes.js").Values | undefined) => import("../../../core/platform/UIString.js").LocalizedString;
export interface BounceTrackingMitigationsViewData {
    trackingSites: string[];
}
export declare class BounceTrackingMitigationsView extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-bounce-tracking-mitigations-view': BounceTrackingMitigationsView;
    }
}
