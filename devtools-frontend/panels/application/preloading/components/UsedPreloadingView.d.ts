import * as SDK from '../../../../core/sdk/sdk.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
type UsedPreloadingViewData = SDK.PreloadingModel.PreloadingAttempt[];
export declare class UsedPreloadingView extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
    #private;
    static readonly litTagName: import("../../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
    set data(data: UsedPreloadingViewData);
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-used-preloading-view': UsedPreloadingView;
    }
}
export {};
