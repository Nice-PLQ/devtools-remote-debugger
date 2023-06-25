import * as UI from '../../ui/legacy/legacy.js';
import type * as Actions from './recorder-actions.js';
export declare class RecorderPanel extends UI.Panel.Panel {
    #private;
    static panelName: string;
    constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): RecorderPanel;
    wasShown(): void;
    willHide(): void;
    handleActions(actionId: Actions.RecorderActions): void;
    isActionPossible(actionId: Actions.RecorderActions): boolean;
}
export declare class ActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    }): ActionDelegate;
    handleAction(_context: UI.Context.Context, actionId: Actions.RecorderActions): boolean;
}
