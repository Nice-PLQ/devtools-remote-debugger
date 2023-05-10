import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AffectedSharedArrayBufferIssueDetailsView extends AffectedResourcesView {
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendStatus;
    private appendType;
    private appendDetails;
    private appendDetail;
    update(): void;
}
