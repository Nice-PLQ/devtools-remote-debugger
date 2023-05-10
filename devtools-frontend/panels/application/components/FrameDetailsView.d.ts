import * as SDK from '../../../core/sdk/sdk.js';
import * as UI from '../../../ui/legacy/legacy.js';
export declare class FrameDetailsView extends UI.ThrottledWidget.ThrottledWidget {
    private readonly reportView;
    private readonly frame;
    constructor(frame: SDK.ResourceTreeModel.ResourceTreeFrame);
    doUpdate(): Promise<void>;
}
export interface FrameDetailsReportViewData {
    frame: SDK.ResourceTreeModel.ResourceTreeFrame;
}
export declare class FrameDetailsReportView extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private frame?;
    private protocolMonitorExperimentEnabled;
    private permissionsPolicies;
    private permissionsPolicySectionData;
    private originTrialTreeView;
    connectedCallback(): void;
    set data(data: FrameDetailsReportViewData);
    private render;
    private renderOriginTrial;
    private renderDocumentSection;
    private maybeRenderSourcesLinkForURL;
    private maybeRenderNetworkLinkForURL;
    private uiSourceCodeForFrame;
    private maybeRenderUnreachableURL;
    private renderNetworkLinkForUnreachableURL;
    private maybeRenderOrigin;
    private renderOwnerElement;
    private maybeRenderCreationStacktrace;
    private getAdFrameTypeStrings;
    private getAdFrameExplanationString;
    private maybeRenderAdStatus;
    private renderIsolationSection;
    private maybeRenderSecureContextExplanation;
    private getSecureContextExplanation;
    private maybeRenderCoopCoepStatus;
    private maybeRenderCrossOriginStatus;
    private renderApiAvailabilitySection;
    private renderSharedArrayBufferAvailability;
    private renderMeasureMemoryAvailability;
    private renderAdditionalInfoSection;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-frame-details-view': FrameDetailsReportView;
    }
}
