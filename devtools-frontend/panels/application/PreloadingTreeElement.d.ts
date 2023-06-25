import type * as SDK from '../../core/sdk/sdk.js';
import type * as Platform from '../../core/platform/platform.js';
import { ApplicationPanelTreeElement } from './ApplicationPanelTreeElement.js';
import { type ResourcesPanel } from './ResourcesPanel.js';
import { PreloadingRuleSetView, PreloadingAttemptView, PreloadingResultView } from './preloading/PreloadingView.js';
type M = SDK.PreloadingModel.PreloadingModel;
export declare class PreloadingTreeElement<V extends PreloadingRuleSetView | PreloadingAttemptView | PreloadingResultView> extends ApplicationPanelTreeElement {
    #private;
    private model?;
    private ctorV;
    private view?;
    private path;
    static newForPreloadingRuleSetView(resourcesPanel: ResourcesPanel): PreloadingTreeElement<PreloadingRuleSetView>;
    static newForPreloadingAttemptView(resourcesPanel: ResourcesPanel): PreloadingTreeElement<PreloadingAttemptView>;
    static newForPreloadingResultView(resourcesPanel: ResourcesPanel): PreloadingTreeElement<PreloadingResultView>;
    constructor(resourcesPanel: ResourcesPanel, ctorV: {
        new (model: M): V;
    }, path: string, title: string);
    get itemURL(): Platform.DevToolsPath.UrlString;
    initialize(model: SDK.PreloadingModel.PreloadingModel): void;
    onselect(selectedByUser?: boolean): boolean;
}
export {};
