// Copyright 2025 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as ProjectSettings from '../project_settings/project_settings.js';
let automaticFileSystemManagerInstance;
/**
 * Automatically connects and disconnects workspace folders.
 *
 * @see http://go/chrome-devtools:automatic-workspace-folders-design
 */
export class AutomaticFileSystemManager extends Common.ObjectWrapper.ObjectWrapper {
    #automaticFileSystem;
    #inspectorFrontendHost;
    #projectSettingsModel;
    /**
     * Yields the current `AutomaticFileSystem` (if any).
     *
     * @return the current automatic file system or `null`.
     */
    get automaticFileSystem() {
        return this.#automaticFileSystem;
    }
    /**
     * @internal
     */
    constructor(hostConfig, inspectorFrontendHost, projectSettingsModel) {
        super();
        this.#automaticFileSystem = null;
        this.#inspectorFrontendHost = inspectorFrontendHost;
        this.#projectSettingsModel = projectSettingsModel;
        if (hostConfig.devToolsAutomaticFileSystems?.enabled) {
            this.#projectSettingsModel.addEventListener("ProjectSettingsChanged" /* ProjectSettings.ProjectSettingsModel.Events.PROJECT_SETTINGS_CHANGED */, this.#projectSettingsChanged, this);
            this.#projectSettingsChanged({ data: this.#projectSettingsModel.projectSettings });
        }
    }
    /**
     * Yields the `AutomaticFileSystemManager` singleton.
     *
     * @returns the singleton.
     */
    static instance({ forceNew, hostConfig, inspectorFrontendHost, projectSettingsModel } = { forceNew: false, hostConfig: null, inspectorFrontendHost: null, projectSettingsModel: null }) {
        if (!automaticFileSystemManagerInstance || forceNew) {
            if (!hostConfig || !inspectorFrontendHost || !projectSettingsModel) {
                throw new Error('Unable to create AutomaticFileSysteManager: ' +
                    'hostConfig, inspectorFrontendHost, and projectSettingsModel must be provided');
            }
            automaticFileSystemManagerInstance = new AutomaticFileSystemManager(hostConfig, inspectorFrontendHost, projectSettingsModel);
        }
        return automaticFileSystemManagerInstance;
    }
    /**
     * Clears the `AutomaticFileSystemManager` singleton (if any);
     */
    static removeInstance() {
        if (automaticFileSystemManagerInstance) {
            automaticFileSystemManagerInstance.#dispose();
            automaticFileSystemManagerInstance = undefined;
        }
    }
    #dispose() {
        this.#projectSettingsModel.removeEventListener("ProjectSettingsChanged" /* ProjectSettings.ProjectSettingsModel.Events.PROJECT_SETTINGS_CHANGED */, this.#projectSettingsChanged, this);
    }
    #projectSettingsChanged(event) {
        const projectSettings = event.data;
        let automaticFileSystem = this.#automaticFileSystem;
        if (projectSettings.workspace) {
            const { root, uuid } = projectSettings.workspace;
            if (automaticFileSystem === null || automaticFileSystem.root !== root || automaticFileSystem.uuid !== uuid) {
                automaticFileSystem = Object.freeze({ root, uuid, state: 'disconnected' });
            }
        }
        else if (automaticFileSystem !== null) {
            automaticFileSystem = null;
        }
        if (this.#automaticFileSystem !== automaticFileSystem) {
            this.disconnectedAutomaticFileSystem();
            this.#automaticFileSystem = automaticFileSystem;
            this.dispatchEventToListeners("AutomaticFileSystemChanged" /* Events.AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
            void this.connectAutomaticFileSystem(/* addIfMissing= */ false);
        }
    }
    /**
     * Attempt to connect the automatic workspace folder (if any).
     *
     * @param addIfMissing if `false` (the default), this will only try to connect
     *                     to a previously connected automatic workspace folder.
     *                     If the folder was never connected before and `true` is
     *                     specified, the user will be asked to grant permission
     *                     to allow Chrome DevTools to access the folder first.
     * @returns `true` if the automatic workspace folder was connected, `false`
     *          if there wasn't any, or the connection attempt failed (e.g. the
     *          user did not grant permission).
     */
    async connectAutomaticFileSystem(addIfMissing = false) {
        if (!this.#automaticFileSystem) {
            return false;
        }
        const { root, uuid, state } = this.#automaticFileSystem;
        if (state === 'disconnected') {
            const automaticFileSystem = this.#automaticFileSystem =
                Object.freeze({ ...this.#automaticFileSystem, state: 'connecting' });
            this.dispatchEventToListeners("AutomaticFileSystemChanged" /* Events.AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
            const { success } = await new Promise(resolve => this.#inspectorFrontendHost.connectAutomaticFileSystem(root, uuid, addIfMissing, resolve));
            if (this.#automaticFileSystem === automaticFileSystem) {
                const state = success ? 'connected' : 'disconnected';
                this.#automaticFileSystem = Object.freeze({ ...automaticFileSystem, state });
                this.dispatchEventToListeners("AutomaticFileSystemChanged" /* Events.AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
            }
        }
        return this.#automaticFileSystem?.state === 'connected';
    }
    /**
     * Disconnects any automatic workspace folder.
     */
    disconnectedAutomaticFileSystem() {
        if (this.#automaticFileSystem && this.#automaticFileSystem.state !== 'disconnected') {
            this.#inspectorFrontendHost.disconnectAutomaticFileSystem(this.#automaticFileSystem.root);
            this.#automaticFileSystem = Object.freeze({ ...this.#automaticFileSystem, state: 'disconnected' });
            this.dispatchEventToListeners("AutomaticFileSystemChanged" /* Events.AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
        }
    }
}
//# sourceMappingURL=AutomaticFileSystemManager.js.map