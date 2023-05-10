import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AffectedDirectivesView extends AffectedResourcesView {
    private appendStatus;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendViolatedDirective;
    private appendBlockedURL;
    private appendBlockedElement;
    private appendAffectedContentSecurityPolicyDetails;
    private appendAffectedContentSecurityPolicyDetail;
    update(): void;
}
