import * as UI from '../../ui/legacy/legacy.js';
export declare class RenderingOptionsView extends UI.Widget.VBox {
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): RenderingOptionsView;
    private createCheckbox;
    private appendCheckbox;
    private appendSelect;
    wasShown(): void;
}
