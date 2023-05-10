import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class GenericIssueDetailsView extends AffectedResourcesView {
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendDetails;
    private appendDetail;
    update(): void;
}
