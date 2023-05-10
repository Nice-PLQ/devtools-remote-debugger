import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AttributionReportingIssueDetailsView extends AffectedResourcesView {
    protected getResourceNameWithCount(count: number): string;
    update(): void;
    private appendDetails;
    private appendDetail;
    private appendFrameOrEmptyCell;
    private appendElementOrEmptyCell;
    private appendRequestOrEmptyCell;
}
