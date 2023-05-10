import * as UI from '../../ui/legacy/legacy.js';
export declare class ReleaseNoteView extends UI.Widget.VBox {
    private readonly releaseNoteElement;
    constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): ReleaseNoteView;
    elementsToRestoreScrollPositionsFor(): Element[];
    private createReleaseNoteElement;
    wasShown(): void;
}
