import { AffectedElementsView } from './AffectedElementsView.js';
export declare class AffectedElementsWithLowContrastView extends AffectedElementsView {
    private runningUpdatePromise;
    update(): void;
    private doUpdate;
    private appendLowContrastElement;
    private appendLowContrastElements;
}
