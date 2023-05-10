import * as Protocol from '../../../generated/protocol.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
import type * as Platform from '../../../core/platform/platform.js';
export interface PermissionsPolicySectionData {
    policies: Protocol.Page.PermissionsPolicyFeatureState[];
    showDetails: boolean;
}
export declare function renderIconLink(iconName: string, title: Platform.UIString.LocalizedString, clickHandler: (() => void) | (() => Promise<void>)): LitHtml.TemplateResult;
export declare class PermissionsPolicySection extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private permissionsPolicySectionData;
    set data(data: PermissionsPolicySectionData);
    connectedCallback(): void;
    private toggleShowPermissionsDisallowedDetails;
    private renderAllowed;
    private renderDisallowed;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-permissions-policy-section': PermissionsPolicySection;
    }
}
