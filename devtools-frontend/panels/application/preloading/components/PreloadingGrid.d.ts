import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
export declare const i18nString: (id: string, values?: import("../../../../core/i18n/i18nTypes.js").Values | undefined) => import("../../../../core/platform/UIString.js").LocalizedString;
export interface PreloadingGridRow {
    id: string;
    action: string;
    url: string;
    status: string;
}
export declare class PreloadingGrid extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
    #private;
    static readonly litTagName: import("../../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
    update(rows: PreloadingGridRow[]): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-preloading-grid': PreloadingGrid;
    }
}
