import * as Common from '../../core/common/common.js';
import type * as TextUtils from '../text_utils/text_utils.js';
import type { UISourceCodeMetadata } from './UISourceCode.js';
import { UISourceCode } from './UISourceCode.js';
export interface ProjectSearchConfig {
    query(): string;
    ignoreCase(): boolean;
    isRegex(): boolean;
    queries(): string[];
    filePathMatchesFileQuery(filePath: string): boolean;
}
export declare abstract class Project {
    abstract workspace(): WorkspaceImpl;
    abstract id(): string;
    abstract type(): string;
    abstract isServiceProject(): boolean;
    abstract displayName(): string;
    abstract requestMetadata(uiSourceCode: UISourceCode): Promise<UISourceCodeMetadata | null>;
    abstract requestFileContent(uiSourceCode: UISourceCode): Promise<TextUtils.ContentProvider.DeferredContent>;
    abstract canSetFileContent(): boolean;
    abstract setFileContent(uiSourceCode: UISourceCode, newContent: string, isBase64: boolean): Promise<void>;
    abstract fullDisplayName(uiSourceCode: UISourceCode): string;
    abstract mimeType(uiSourceCode: UISourceCode): string;
    abstract canRename(): boolean;
    rename(_uiSourceCode: UISourceCode, _newName: string, _callback: (arg0: boolean, arg1?: string, arg2?: string, arg3?: Common.ResourceType.ResourceType) => void): void;
    excludeFolder(_path: string): void;
    abstract canExcludeFolder(path: string): boolean;
    abstract createFile(path: string, name: string | null, content: string, isBase64?: boolean): Promise<UISourceCode | null>;
    abstract canCreateFile(): boolean;
    deleteFile(_uiSourceCode: UISourceCode): void;
    remove(): void;
    abstract searchInFileContent(uiSourceCode: UISourceCode, query: string, caseSensitive: boolean, isRegex: boolean): Promise<TextUtils.ContentProvider.SearchMatch[]>;
    abstract findFilesMatchingSearchRequest(searchConfig: ProjectSearchConfig, filesMathingFileQuery: string[], progress: Common.Progress.Progress): Promise<string[]>;
    indexContent(_progress: Common.Progress.Progress): void;
    abstract uiSourceCodeForURL(url: string): UISourceCode | null;
    abstract uiSourceCodes(): UISourceCode[];
}
export declare enum projectTypes {
    Debugger = "debugger",
    Formatter = "formatter",
    Network = "network",
    FileSystem = "filesystem",
    ContentScripts = "contentscripts",
    Service = "service"
}
export declare class ProjectStore {
    private readonly workspaceInternal;
    private readonly idInternal;
    private readonly typeInternal;
    private readonly displayNameInternal;
    private uiSourceCodesMap;
    private uiSourceCodesList;
    private readonly project;
    constructor(workspace: WorkspaceImpl, id: string, type: projectTypes, displayName: string);
    id(): string;
    type(): string;
    displayName(): string;
    workspace(): WorkspaceImpl;
    createUISourceCode(url: string, contentType: Common.ResourceType.ResourceType): UISourceCode;
    addUISourceCode(uiSourceCode: UISourceCode): boolean;
    removeUISourceCode(url: string): void;
    removeProject(): void;
    uiSourceCodeForURL(url: string): UISourceCode | null;
    uiSourceCodes(): UISourceCode[];
    renameUISourceCode(uiSourceCode: UISourceCode, newName: string): void;
}
export declare class WorkspaceImpl extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
    private projectsInternal;
    private hasResourceContentTrackingExtensionsInternal;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): WorkspaceImpl;
    static removeInstance(): void;
    uiSourceCode(projectId: string, url: string): UISourceCode | null;
    uiSourceCodeForURL(url: string): UISourceCode | null;
    uiSourceCodesForProjectType(type: string): UISourceCode[];
    addProject(project: Project): void;
    removeProject(project: Project): void;
    project(projectId: string): Project | null;
    projects(): Project[];
    projectsForType(type: string): Project[];
    uiSourceCodes(): UISourceCode[];
    setHasResourceContentTrackingExtensions(hasExtensions: boolean): void;
    hasResourceContentTrackingExtensions(): boolean;
}
export declare enum Events {
    UISourceCodeAdded = "UISourceCodeAdded",
    UISourceCodeRemoved = "UISourceCodeRemoved",
    UISourceCodeRenamed = "UISourceCodeRenamed",
    WorkingCopyChanged = "WorkingCopyChanged",
    WorkingCopyCommitted = "WorkingCopyCommitted",
    WorkingCopyCommittedByUser = "WorkingCopyCommittedByUser",
    ProjectAdded = "ProjectAdded",
    ProjectRemoved = "ProjectRemoved"
}
export interface UISourceCodeRenamedEvent {
    oldURL: string;
    uiSourceCode: UISourceCode;
}
export interface WorkingCopyChangedEvent {
    uiSourceCode: UISourceCode;
}
export interface WorkingCopyCommitedEvent {
    uiSourceCode: UISourceCode;
    content: string;
    encoded?: boolean;
}
export declare type EventTypes = {
    [Events.UISourceCodeAdded]: UISourceCode;
    [Events.UISourceCodeRemoved]: UISourceCode;
    [Events.UISourceCodeRenamed]: UISourceCodeRenamedEvent;
    [Events.WorkingCopyChanged]: WorkingCopyChangedEvent;
    [Events.WorkingCopyCommitted]: WorkingCopyCommitedEvent;
    [Events.WorkingCopyCommittedByUser]: WorkingCopyCommitedEvent;
    [Events.ProjectAdded]: Project;
    [Events.ProjectRemoved]: Project;
};
