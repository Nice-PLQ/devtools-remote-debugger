import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AffectedElementsView extends AffectedResourcesView {
    private appendAffectedElements;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private appendAffectedElement;
    update(): void;
}
