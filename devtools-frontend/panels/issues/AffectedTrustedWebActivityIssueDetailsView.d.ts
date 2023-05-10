import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AffectedTrustedWebActivityIssueDetailsView extends AffectedResourcesView {
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendDetail;
    private appendDetails;
    update(): void;
}
