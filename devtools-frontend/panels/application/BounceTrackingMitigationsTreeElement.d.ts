import type * as Platform from '../../core/platform/platform.js';
import * as UI from '../../ui/legacy/legacy.js';
import { ApplicationPanelTreeElement } from './ApplicationPanelTreeElement.js';
import * as ApplicationComponents from './components/components.js';
import { type ResourcesPanel } from './ResourcesPanel.js';
export declare const i18nString: (id: string, values?: import("../../core/i18n/i18nTypes.js").Values | undefined) => Platform.UIString.LocalizedString;
export declare class BounceTrackingMitigationsTreeElement extends ApplicationPanelTreeElement {
    private view?;
    constructor(resourcesPanel: ResourcesPanel);
    get itemURL(): Platform.DevToolsPath.UrlString;
    onselect(selectedByUser?: boolean): boolean;
}
export declare class BounceTrackingMitigationsViewWidgetWrapper extends UI.ThrottledWidget.ThrottledWidget {
    private readonly bounceTrackingMitigationsView;
    constructor(bounceTrackingMitigationsView: ApplicationComponents.BounceTrackingMitigationsView.BounceTrackingMitigationsView);
    protected doUpdate(): Promise<void>;
}
