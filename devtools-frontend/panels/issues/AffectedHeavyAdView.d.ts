import type * as Platform from '../../core/platform/platform.js';
import { AffectedResourcesView } from './AffectedResourcesView.js';
export declare class AffectedHeavyAdView extends AffectedResourcesView {
    private appendAffectedHeavyAds;
    protected getResourceNameWithCount(count: number): Platform.UIString.LocalizedString;
    private statusToString;
    private limitToString;
    private appendAffectedHeavyAd;
    update(): void;
}
