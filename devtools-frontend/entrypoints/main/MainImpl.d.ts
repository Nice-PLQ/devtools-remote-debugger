import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class MainImpl {
    private lateInitDonePromise;
    constructor();
    static time(label: string): void;
    static timeEnd(label: string): void;
    private loaded;
    requestAndRegisterLocaleData(): Promise<void>;
    private createSettings;
    private initializeExperiments;
    private createAppUI;
    private showAppUI;
    private initializeTarget;
    private lateInitialization;
    lateInitDonePromiseForTest(): Promise<void> | null;
    private registerMessageSinkListener;
    private revealSourceLine;
    private postDocumentKeyDown;
    private redispatchClipboardEvent;
    private contextMenuEventFired;
    private addMainEventListeners;
    private onSuspendStateChanged;
    static instanceForTest: MainImpl | null;
}
export declare class ZoomActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    }): ZoomActionDelegate;
    handleAction(context: UI.Context.Context, actionId: string): boolean;
}
export declare class SearchActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    }): SearchActionDelegate;
    handleAction(context: UI.Context.Context, actionId: string): boolean;
}
export declare class MainMenuItem implements UI.Toolbar.Provider {
    private readonly itemInternal;
    constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): MainMenuItem;
    item(): UI.Toolbar.ToolbarItem | null;
    private handleContextMenu;
}
export declare class SettingsButtonProvider implements UI.Toolbar.Provider {
    private readonly settingsButton;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): SettingsButtonProvider;
    item(): UI.Toolbar.ToolbarItem | null;
}
export declare class PauseListener {
    constructor();
    private debuggerPaused;
}
export declare function sendOverProtocol(method: ProtocolClient.InspectorBackend.QualifiedName, params: Object | null): Promise<unknown[] | null>;
export declare class ReloadActionDelegate implements UI.ActionRegistration.ActionDelegate {
    static instance(opts?: {
        forceNew: boolean | null;
    }): ReloadActionDelegate;
    handleAction(context: UI.Context.Context, actionId: string): boolean;
}
