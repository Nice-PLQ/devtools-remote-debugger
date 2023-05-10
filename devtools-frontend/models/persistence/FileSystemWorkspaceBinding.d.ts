import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as Workspace from '../workspace/workspace.js';
import type { IsolatedFileSystemManager } from './IsolatedFileSystemManager.js';
import type { PlatformFileSystem } from './PlatformFileSystem.js';
export declare class FileSystemWorkspaceBinding {
    readonly isolatedFileSystemManager: IsolatedFileSystemManager;
    private readonly workspace;
    private readonly eventListeners;
    private readonly boundFileSystems;
    constructor(isolatedFileSystemManager: IsolatedFileSystemManager, workspace: Workspace.Workspace.WorkspaceImpl);
    static projectId(fileSystemPath: string): string;
    static relativePath(uiSourceCode: Workspace.UISourceCode.UISourceCode): string[];
    static tooltipForUISourceCode(uiSourceCode: Workspace.UISourceCode.UISourceCode): string;
    static fileSystemType(project: Workspace.Workspace.Project): string;
    static fileSystemSupportsAutomapping(project: Workspace.Workspace.Project): boolean;
    static completeURL(project: Workspace.Workspace.Project, relativePath: string): string;
    static fileSystemPath(projectId: string): string;
    fileSystemManager(): IsolatedFileSystemManager;
    private onFileSystemsLoaded;
    private onFileSystemAdded;
    private addFileSystem;
    private onFileSystemRemoved;
    private fileSystemFilesChanged;
    dispose(): void;
}
export declare class FileSystem extends Workspace.Workspace.ProjectStore implements Workspace.Workspace.Project {
    readonly fileSystemInternal: PlatformFileSystem;
    readonly fileSystemBaseURL: string;
    private readonly fileSystemParentURL;
    private readonly fileSystemWorkspaceBinding;
    private readonly fileSystemPathInternal;
    private readonly creatingFilesGuard;
    constructor(fileSystemWorkspaceBinding: FileSystemWorkspaceBinding, isolatedFileSystem: PlatformFileSystem, workspace: Workspace.Workspace.WorkspaceImpl);
    fileSystemPath(): string;
    fileSystem(): PlatformFileSystem;
    mimeType(uiSourceCode: Workspace.UISourceCode.UISourceCode): string;
    initialGitFolders(): string[];
    private filePathForUISourceCode;
    isServiceProject(): boolean;
    requestMetadata(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<Workspace.UISourceCode.UISourceCodeMetadata | null>;
    requestFileBlob(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<Blob | null>;
    requestFileContent(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<TextUtils.ContentProvider.DeferredContent>;
    canSetFileContent(): boolean;
    setFileContent(uiSourceCode: Workspace.UISourceCode.UISourceCode, newContent: string, isBase64: boolean): Promise<void>;
    fullDisplayName(uiSourceCode: Workspace.UISourceCode.UISourceCode): string;
    canRename(): boolean;
    rename(uiSourceCode: Workspace.UISourceCode.UISourceCode, newName: string, callback: (arg0: boolean, arg1?: string | undefined, arg2?: string | undefined, arg3?: Common.ResourceType.ResourceType | undefined) => void): void;
    searchInFileContent(uiSourceCode: Workspace.UISourceCode.UISourceCode, query: string, caseSensitive: boolean, isRegex: boolean): Promise<TextUtils.ContentProvider.SearchMatch[]>;
    findFilesMatchingSearchRequest(searchConfig: Workspace.Workspace.ProjectSearchConfig, filesMathingFileQuery: string[], progress: Common.Progress.Progress): Promise<string[]>;
    indexContent(progress: Common.Progress.Progress): void;
    populate(): void;
    excludeFolder(url: string): void;
    canExcludeFolder(path: string): boolean;
    canCreateFile(): boolean;
    createFile(path: string, name: string | null, content: string, isBase64?: boolean): Promise<Workspace.UISourceCode.UISourceCode | null>;
    deleteFile(uiSourceCode: Workspace.UISourceCode.UISourceCode): void;
    remove(): void;
    private addFile;
    fileChanged(path: string): void;
    tooltipForURL(url: string): string;
    dispose(): void;
}
export interface FilesChangedData {
    changed: Platform.MapUtilities.Multimap<string, string>;
    added: Platform.MapUtilities.Multimap<string, string>;
    removed: Platform.MapUtilities.Multimap<string, string>;
}
