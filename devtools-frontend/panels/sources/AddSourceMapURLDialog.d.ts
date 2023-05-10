import * as UI from '../../ui/legacy/legacy.js';
export declare class AddSourceMapURLDialog extends UI.Widget.HBox {
    private readonly input;
    private readonly dialog;
    private readonly callback;
    constructor(callback: (arg0: string) => void);
    show(): void;
    private done;
    private apply;
    private onKeyDown;
    wasShown(): void;
}
