import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class WasmCrossOriginModuleSharingAffectedResourcesView extends AffectedResourcesView {
    private appendIssues;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendDetails;
    update(): void;
}
