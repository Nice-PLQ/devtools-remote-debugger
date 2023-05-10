// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Workspace from '../workspace/workspace.js';
import { FileSystemWorkspaceBinding } from './FileSystemWorkspaceBinding.js';
import { PersistenceBinding, PersistenceImpl } from './PersistenceImpl.js';
let networkPersistenceManagerInstance;
export class NetworkPersistenceManager extends Common.ObjectWrapper.ObjectWrapper {
    bindings;
    originalResponseContentPromises;
    savingForOverrides;
    savingSymbol;
    enabledSetting;
    workspace;
    networkUISourceCodeForEncodedPath;
    interceptionHandlerBound;
    updateInterceptionThrottler;
    projectInternal;
    activeProject;
    activeInternal;
    enabled;
    eventDescriptors;
    constructor(workspace) {
        super();
        this.bindings = new WeakMap();
        this.originalResponseContentPromises = new WeakMap();
        this.savingForOverrides = new WeakSet();
        this.savingSymbol = Symbol('SavingForOverrides');
        this.enabledSetting = Common.Settings.Settings.instance().moduleSetting('persistenceNetworkOverridesEnabled');
        this.enabledSetting.addChangeListener(this.enabledChanged, this);
        this.workspace = workspace;
        this.networkUISourceCodeForEncodedPath = new Map();
        this.interceptionHandlerBound = this.interceptionHandler.bind(this);
        this.updateInterceptionThrottler = new Common.Throttler.Throttler(50);
        this.projectInternal = null;
        this.activeProject = null;
        this.activeInternal = false;
        this.enabled = false;
        this.workspace.addEventListener(Workspace.Workspace.Events.ProjectAdded, event => {
            this.onProjectAdded(event.data);
        });
        this.workspace.addEventListener(Workspace.Workspace.Events.ProjectRemoved, event => {
            this.onProjectRemoved(event.data);
        });
        PersistenceImpl.instance().addNetworkInterceptor(this.canHandleNetworkUISourceCode.bind(this));
        this.eventDescriptors = [];
        this.enabledChanged();
        SDK.TargetManager.TargetManager.instance().observeTargets(this);
    }
    targetAdded() {
        this.updateActiveProject();
    }
    targetRemoved() {
        this.updateActiveProject();
    }
    static instance(opts = { forceNew: null, workspace: null }) {
        const { forceNew, workspace } = opts;
        if (!networkPersistenceManagerInstance || forceNew) {
            if (!workspace) {
                throw new Error('Missing workspace for NetworkPersistenceManager');
            }
            networkPersistenceManagerInstance = new NetworkPersistenceManager(workspace);
        }
        return networkPersistenceManagerInstance;
    }
    active() {
        return this.activeInternal;
    }
    project() {
        return this.projectInternal;
    }
    originalContentForUISourceCode(uiSourceCode) {
        const binding = this.bindings.get(uiSourceCode);
        if (!binding) {
            return null;
        }
        const fileSystemUISourceCode = binding.fileSystem;
        return this.originalResponseContentPromises.get(fileSystemUISourceCode) || null;
    }
    async enabledChanged() {
        if (this.enabled === this.enabledSetting.get()) {
            return;
        }
        this.enabled = this.enabledSetting.get();
        if (this.enabled) {
            this.eventDescriptors = [
                Workspace.Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Workspace.Events.UISourceCodeRenamed, event => {
                    this.uiSourceCodeRenamedListener(event);
                }),
                Workspace.Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Workspace.Events.UISourceCodeAdded, event => {
                    this.uiSourceCodeAdded(event);
                }),
                Workspace.Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Workspace.Events.UISourceCodeRemoved, event => {
                    this.uiSourceCodeRemovedListener(event);
                }),
                Workspace.Workspace.WorkspaceImpl.instance().addEventListener(Workspace.Workspace.Events.WorkingCopyCommitted, event => this.onUISourceCodeWorkingCopyCommitted(event.data.uiSourceCode)),
            ];
            await this.updateActiveProject();
        }
        else {
            Common.EventTarget.removeEventListeners(this.eventDescriptors);
            await this.updateActiveProject();
        }
    }
    async uiSourceCodeRenamedListener(event) {
        const uiSourceCode = event.data.uiSourceCode;
        await this.onUISourceCodeRemoved(uiSourceCode);
        await this.onUISourceCodeAdded(uiSourceCode);
    }
    async uiSourceCodeRemovedListener(event) {
        await this.onUISourceCodeRemoved(event.data);
    }
    async uiSourceCodeAdded(event) {
        await this.onUISourceCodeAdded(event.data);
    }
    async updateActiveProject() {
        const wasActive = this.activeInternal;
        this.activeInternal = Boolean(this.enabledSetting.get() && SDK.TargetManager.TargetManager.instance().mainTarget() && this.projectInternal);
        if (this.activeInternal === wasActive) {
            return;
        }
        if (this.activeInternal && this.projectInternal) {
            await Promise.all(this.projectInternal.uiSourceCodes().map(uiSourceCode => this.filesystemUISourceCodeAdded(uiSourceCode)));
            const networkProjects = this.workspace.projectsForType(Workspace.Workspace.projectTypes.Network);
            for (const networkProject of networkProjects) {
                await Promise.all(networkProject.uiSourceCodes().map(uiSourceCode => this.networkUISourceCodeAdded(uiSourceCode)));
            }
        }
        else if (this.projectInternal) {
            await Promise.all(this.projectInternal.uiSourceCodes().map(uiSourceCode => this.filesystemUISourceCodeRemoved(uiSourceCode)));
            this.networkUISourceCodeForEncodedPath.clear();
        }
        PersistenceImpl.instance().refreshAutomapping();
    }
    encodedPathFromUrl(url) {
        if (!this.activeInternal || !this.projectInternal) {
            return '';
        }
        let urlPath = Common.ParsedURL.ParsedURL.urlWithoutHash(url.replace(/^https?:\/\//, ''));
        if (urlPath.endsWith('/') && urlPath.indexOf('?') === -1) {
            urlPath = urlPath + 'index.html';
        }
        let encodedPathParts = encodeUrlPathToLocalPathParts(urlPath);
        const projectPath = FileSystemWorkspaceBinding.fileSystemPath(this.projectInternal.id());
        const encodedPath = encodedPathParts.join('/');
        if (projectPath.length + encodedPath.length > 200) {
            const domain = encodedPathParts[0];
            const encodedFileName = encodedPathParts[encodedPathParts.length - 1];
            const shortFileName = encodedFileName ? encodedFileName.substr(0, 10) + '-' : '';
            const extension = Common.ParsedURL.ParsedURL.extractExtension(urlPath);
            const extensionPart = extension ? '.' + extension.substr(0, 10) : '';
            encodedPathParts = [
                domain,
                'longurls',
                shortFileName + Platform.StringUtilities.hashCode(encodedPath).toString(16) + extensionPart,
            ];
        }
        return encodedPathParts.join('/');
        function encodeUrlPathToLocalPathParts(urlPath) {
            const encodedParts = [];
            for (const pathPart of fileNamePartsFromUrlPath(urlPath)) {
                if (!pathPart) {
                    continue;
                }
                // encodeURI() escapes all the unsafe filename characters except /:?*
                let encodedName = encodeURI(pathPart).replace(/[\/:\?\*]/g, match => '%' + match[0].charCodeAt(0).toString(16));
                // Windows does not allow a small set of filenames.
                if (RESERVED_FILENAMES.has(encodedName.toLowerCase())) {
                    encodedName = encodedName.split('').map(char => '%' + char.charCodeAt(0).toString(16)).join('');
                }
                // Windows does not allow the file to end in a space or dot (space should already be encoded).
                const lastChar = encodedName.charAt(encodedName.length - 1);
                if (lastChar === '.') {
                    encodedName = encodedName.substr(0, encodedName.length - 1) + '%2e';
                }
                encodedParts.push(encodedName);
            }
            return encodedParts;
        }
        function fileNamePartsFromUrlPath(urlPath) {
            urlPath = Common.ParsedURL.ParsedURL.urlWithoutHash(urlPath);
            const queryIndex = urlPath.indexOf('?');
            if (queryIndex === -1) {
                return urlPath.split('/');
            }
            if (queryIndex === 0) {
                return [urlPath];
            }
            const endSection = urlPath.substr(queryIndex);
            const parts = urlPath.substr(0, urlPath.length - endSection.length).split('/');
            parts[parts.length - 1] += endSection;
            return parts;
        }
    }
    decodeLocalPathToUrlPath(path) {
        try {
            return unescape(path);
        }
        catch (e) {
            console.error(e);
        }
        return path;
    }
    async unbind(uiSourceCode) {
        const binding = this.bindings.get(uiSourceCode);
        if (binding) {
            this.bindings.delete(binding.network);
            this.bindings.delete(binding.fileSystem);
            await PersistenceImpl.instance().removeBinding(binding);
        }
    }
    async bind(networkUISourceCode, fileSystemUISourceCode) {
        if (this.bindings.has(networkUISourceCode)) {
            await this.unbind(networkUISourceCode);
        }
        if (this.bindings.has(fileSystemUISourceCode)) {
            await this.unbind(fileSystemUISourceCode);
        }
        const binding = new PersistenceBinding(networkUISourceCode, fileSystemUISourceCode);
        this.bindings.set(networkUISourceCode, binding);
        this.bindings.set(fileSystemUISourceCode, binding);
        await PersistenceImpl.instance().addBinding(binding);
        const uiSourceCodeOfTruth = this.savingForOverrides.has(networkUISourceCode) ? networkUISourceCode : fileSystemUISourceCode;
        const [{ content }, encoded] = await Promise.all([uiSourceCodeOfTruth.requestContent(), uiSourceCodeOfTruth.contentEncoded()]);
        PersistenceImpl.instance().syncContent(uiSourceCodeOfTruth, content || '', encoded);
    }
    onUISourceCodeWorkingCopyCommitted(uiSourceCode) {
        this.saveUISourceCodeForOverrides(uiSourceCode);
    }
    canSaveUISourceCodeForOverrides(uiSourceCode) {
        return this.activeInternal && uiSourceCode.project().type() === Workspace.Workspace.projectTypes.Network &&
            !this.bindings.has(uiSourceCode) && !this.savingForOverrides.has(uiSourceCode);
    }
    async saveUISourceCodeForOverrides(uiSourceCode) {
        if (!this.canSaveUISourceCodeForOverrides(uiSourceCode)) {
            return;
        }
        this.savingForOverrides.add(uiSourceCode);
        let encodedPath = this.encodedPathFromUrl(uiSourceCode.url());
        const content = (await uiSourceCode.requestContent()).content || '';
        const encoded = await uiSourceCode.contentEncoded();
        const lastIndexOfSlash = encodedPath.lastIndexOf('/');
        const encodedFileName = encodedPath.substr(lastIndexOfSlash + 1);
        encodedPath = encodedPath.substr(0, lastIndexOfSlash);
        if (this.projectInternal) {
            await this.projectInternal.createFile(encodedPath, encodedFileName, content, encoded);
        }
        this.fileCreatedForTest(encodedPath, encodedFileName);
        this.savingForOverrides.delete(uiSourceCode);
    }
    fileCreatedForTest(_path, _fileName) {
    }
    patternForFileSystemUISourceCode(uiSourceCode) {
        const relativePathParts = FileSystemWorkspaceBinding.relativePath(uiSourceCode);
        if (relativePathParts.length < 2) {
            return '';
        }
        if (relativePathParts[1] === 'longurls' && relativePathParts.length !== 2) {
            return 'http?://' + relativePathParts[0] + '/*';
        }
        return 'http?://' + this.decodeLocalPathToUrlPath(relativePathParts.join('/'));
    }
    async onUISourceCodeAdded(uiSourceCode) {
        await this.networkUISourceCodeAdded(uiSourceCode);
        await this.filesystemUISourceCodeAdded(uiSourceCode);
    }
    canHandleNetworkUISourceCode(uiSourceCode) {
        return this.activeInternal && !uiSourceCode.url().startsWith('snippet://');
    }
    async networkUISourceCodeAdded(uiSourceCode) {
        if (uiSourceCode.project().type() !== Workspace.Workspace.projectTypes.Network ||
            !this.canHandleNetworkUISourceCode(uiSourceCode)) {
            return;
        }
        const url = Common.ParsedURL.ParsedURL.urlWithoutHash(uiSourceCode.url());
        this.networkUISourceCodeForEncodedPath.set(this.encodedPathFromUrl(url), uiSourceCode);
        const project = this.projectInternal;
        const fileSystemUISourceCode = project.uiSourceCodeForURL(project.fileSystemPath() + '/' + this.encodedPathFromUrl(url));
        if (fileSystemUISourceCode) {
            await this.bind(uiSourceCode, fileSystemUISourceCode);
        }
    }
    async filesystemUISourceCodeAdded(uiSourceCode) {
        if (!this.activeInternal || uiSourceCode.project() !== this.projectInternal) {
            return;
        }
        this.updateInterceptionPatterns();
        const relativePath = FileSystemWorkspaceBinding.relativePath(uiSourceCode);
        const networkUISourceCode = this.networkUISourceCodeForEncodedPath.get(relativePath.join('/'));
        if (networkUISourceCode) {
            await this.bind(networkUISourceCode, uiSourceCode);
        }
    }
    updateInterceptionPatterns() {
        this.updateInterceptionThrottler.schedule(innerUpdateInterceptionPatterns.bind(this));
        function innerUpdateInterceptionPatterns() {
            if (!this.activeInternal || !this.projectInternal) {
                return SDK.NetworkManager.MultitargetNetworkManager.instance().setInterceptionHandlerForPatterns([], this.interceptionHandlerBound);
            }
            const patterns = new Set();
            const indexFileName = 'index.html';
            for (const uiSourceCode of this.projectInternal.uiSourceCodes()) {
                const pattern = this.patternForFileSystemUISourceCode(uiSourceCode);
                patterns.add(pattern);
                if (pattern.endsWith('/' + indexFileName)) {
                    patterns.add(pattern.substr(0, pattern.length - indexFileName.length));
                }
            }
            return SDK.NetworkManager.MultitargetNetworkManager.instance().setInterceptionHandlerForPatterns(Array.from(patterns).map(pattern => ({ urlPattern: pattern, interceptionStage: "HeadersReceived" /* HeadersReceived */ })), this.interceptionHandlerBound);
        }
    }
    async onUISourceCodeRemoved(uiSourceCode) {
        await this.networkUISourceCodeRemoved(uiSourceCode);
        await this.filesystemUISourceCodeRemoved(uiSourceCode);
    }
    async networkUISourceCodeRemoved(uiSourceCode) {
        if (uiSourceCode.project().type() === Workspace.Workspace.projectTypes.Network) {
            await this.unbind(uiSourceCode);
            this.networkUISourceCodeForEncodedPath.delete(this.encodedPathFromUrl(uiSourceCode.url()));
        }
    }
    async filesystemUISourceCodeRemoved(uiSourceCode) {
        if (uiSourceCode.project() !== this.projectInternal) {
            return;
        }
        this.updateInterceptionPatterns();
        this.originalResponseContentPromises.delete(uiSourceCode);
        await this.unbind(uiSourceCode);
    }
    async setProject(project) {
        if (project === this.projectInternal) {
            return;
        }
        if (this.projectInternal) {
            await Promise.all(this.projectInternal.uiSourceCodes().map(uiSourceCode => this.filesystemUISourceCodeRemoved(uiSourceCode)));
        }
        this.projectInternal = project;
        if (this.projectInternal) {
            await Promise.all(this.projectInternal.uiSourceCodes().map(uiSourceCode => this.filesystemUISourceCodeAdded(uiSourceCode)));
        }
        await this.updateActiveProject();
        this.dispatchEventToListeners(Events.ProjectChanged, this.projectInternal);
    }
    async onProjectAdded(project) {
        if (project.type() !== Workspace.Workspace.projectTypes.FileSystem ||
            FileSystemWorkspaceBinding.fileSystemType(project) !== 'overrides') {
            return;
        }
        const fileSystemPath = FileSystemWorkspaceBinding.fileSystemPath(project.id());
        if (!fileSystemPath) {
            return;
        }
        if (this.projectInternal) {
            this.projectInternal.remove();
        }
        await this.setProject(project);
    }
    async onProjectRemoved(project) {
        if (project === this.projectInternal) {
            await this.setProject(null);
        }
    }
    async interceptionHandler(interceptedRequest) {
        const method = interceptedRequest.request.method;
        if (!this.activeInternal || (method !== 'GET' && method !== 'POST')) {
            return;
        }
        const proj = this.projectInternal;
        const path = proj.fileSystemPath() + '/' + this.encodedPathFromUrl(interceptedRequest.request.url);
        const fileSystemUISourceCode = proj.uiSourceCodeForURL(path);
        if (!fileSystemUISourceCode) {
            return;
        }
        let mimeType = '';
        if (interceptedRequest.responseHeaders) {
            const responseHeaders = SDK.NetworkManager.NetworkManager.lowercaseHeaders(interceptedRequest.responseHeaders);
            mimeType = responseHeaders['content-type'];
        }
        if (!mimeType) {
            const expectedResourceType = Common.ResourceType.resourceTypes[interceptedRequest.resourceType] || Common.ResourceType.resourceTypes.Other;
            mimeType = fileSystemUISourceCode.mimeType();
            if (Common.ResourceType.ResourceType.fromMimeType(mimeType) !== expectedResourceType) {
                mimeType = expectedResourceType.canonicalMimeType();
            }
        }
        const project = fileSystemUISourceCode.project();
        this.originalResponseContentPromises.set(fileSystemUISourceCode, interceptedRequest.responseBody().then(response => {
            if (response.error || response.content === null) {
                return null;
            }
            if (response.encoded) {
                const text = atob(response.content);
                const data = new Uint8Array(text.length);
                for (let i = 0; i < text.length; ++i) {
                    data[i] = text.charCodeAt(i);
                }
                return new TextDecoder('utf-8').decode(data);
            }
            return response.content;
        }));
        const blob = await project.requestFileBlob(fileSystemUISourceCode);
        if (blob) {
            interceptedRequest.continueRequestWithContent(new Blob([blob], { type: mimeType }));
        }
    }
}
const RESERVED_FILENAMES = new Set([
    'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7',
    'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
]);
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var Events;
(function (Events) {
    Events["ProjectChanged"] = "ProjectChanged";
})(Events || (Events = {}));
//# sourceMappingURL=NetworkPersistenceManager.js.map