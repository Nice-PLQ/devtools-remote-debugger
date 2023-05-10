import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';
export declare class NetworkPersistenceManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> implements SDK.TargetManager.Observer {
    private bindings;
    private readonly originalResponseContentPromises;
    private savingForOverrides;
    private readonly savingSymbol;
    private enabledSetting;
    private readonly workspace;
    private readonly networkUISourceCodeForEncodedPath;
    private readonly interceptionHandlerBound;
    private readonly updateInterceptionThrottler;
    private projectInternal;
    private readonly activeProject;
    private activeInternal;
    private enabled;
    private eventDescriptors;
    private constructor();
    targetAdded(): void;
    targetRemoved(): void;
    static instance(opts?: {
        forceNew: boolean | null;
        workspace: Workspace.Workspace.WorkspaceImpl | null;
    }): NetworkPersistenceManager;
    active(): boolean;
    project(): Workspace.Workspace.Project | null;
    originalContentForUISourceCode(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<string | null> | null;
    private enabledChanged;
    private uiSourceCodeRenamedListener;
    private uiSourceCodeRemovedListener;
    private uiSourceCodeAdded;
    private updateActiveProject;
    private encodedPathFromUrl;
    private decodeLocalPathToUrlPath;
    private unbind;
    private bind;
    private onUISourceCodeWorkingCopyCommitted;
    canSaveUISourceCodeForOverrides(uiSourceCode: Workspace.UISourceCode.UISourceCode): boolean;
    saveUISourceCodeForOverrides(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<void>;
    private fileCreatedForTest;
    private patternForFileSystemUISourceCode;
    private onUISourceCodeAdded;
    private canHandleNetworkUISourceCode;
    private networkUISourceCodeAdded;
    private filesystemUISourceCodeAdded;
    private updateInterceptionPatterns;
    private onUISourceCodeRemoved;
    private networkUISourceCodeRemoved;
    private filesystemUISourceCodeRemoved;
    private setProject;
    private onProjectAdded;
    private onProjectRemoved;
    private interceptionHandler;
}
export declare enum Events {
    ProjectChanged = "ProjectChanged"
}
export declare type EventTypes = {
    [Events.ProjectChanged]: Workspace.Workspace.Project | null;
};
