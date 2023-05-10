import type * as Platform from '../../core/platform/platform.js';
import { AffectedElementsView } from './AffectedElementsView.js';
export declare class AffectedDocumentsInQuirksModeView extends AffectedElementsView {
    private runningUpdatePromise;
    update(): void;
    protected getResourceName(count: number): Platform.UIString.LocalizedString;
    private doUpdate;
    private appendQuirksModeDocument;
    private appendQuirksModeDocuments;
}
