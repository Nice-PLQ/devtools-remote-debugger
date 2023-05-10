/*
 * Copyright (C) 2014 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import * as Common from '../../core/common/common.js';
import * as Workspace from '../../models/workspace/workspace.js';
import * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
export class EditingLocationHistoryManager {
    sourcesView;
    historyManager;
    currentSourceFrameCallback;
    constructor(sourcesView, currentSourceFrameCallback) {
        this.sourcesView = sourcesView;
        this.historyManager = new Common.SimpleHistoryManager.SimpleHistoryManager(HistoryDepth);
        this.currentSourceFrameCallback = currentSourceFrameCallback;
    }
    trackSourceFrameCursorJumps(sourceFrame) {
        sourceFrame.textEditor.addEventListener(SourceFrame.SourcesTextEditor.Events.JumpHappened, this.onJumpHappened.bind(this));
    }
    onJumpHappened(event) {
        const { from, to } = event.data;
        if (from) {
            this.updateActiveState(from);
        }
        if (to) {
            this.pushActiveState(to);
        }
    }
    rollback() {
        this.historyManager.rollback();
    }
    rollover() {
        this.historyManager.rollover();
    }
    updateCurrentState() {
        const sourceFrame = this.currentSourceFrameCallback();
        if (!sourceFrame) {
            return;
        }
        this.updateActiveState(sourceFrame.textEditor.selection());
    }
    pushNewState() {
        const sourceFrame = this.currentSourceFrameCallback();
        if (!sourceFrame) {
            return;
        }
        this.pushActiveState(sourceFrame.textEditor.selection());
    }
    updateActiveState(selection) {
        const active = this.historyManager.active();
        if (!active) {
            return;
        }
        const sourceFrame = this.currentSourceFrameCallback();
        if (!sourceFrame) {
            return;
        }
        const entry = new EditingLocationHistoryEntry(this.sourcesView, this, sourceFrame, selection);
        active.merge(entry);
    }
    pushActiveState(selection) {
        const sourceFrame = this.currentSourceFrameCallback();
        if (!sourceFrame) {
            return;
        }
        const entry = new EditingLocationHistoryEntry(this.sourcesView, this, sourceFrame, selection);
        this.historyManager.push(entry);
    }
    removeHistoryForSourceCode(uiSourceCode) {
        this.historyManager.filterOut(entry => {
            const historyEntry = entry;
            return historyEntry.projectId === uiSourceCode.project().id() && historyEntry.url === uiSourceCode.url();
        });
    }
}
export const HistoryDepth = 20;
export class EditingLocationHistoryEntry {
    sourcesView;
    editingLocationManager;
    projectId;
    url;
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    positionHandle;
    constructor(sourcesView, editingLocationManager, sourceFrame, selection) {
        this.sourcesView = sourcesView;
        this.editingLocationManager = editingLocationManager;
        const uiSourceCode = sourceFrame.uiSourceCode();
        this.projectId = uiSourceCode.project().id();
        this.url = uiSourceCode.url();
        const position = this.positionFromSelection(selection);
        this.positionHandle = sourceFrame.textEditor.textEditorPositionHandle(position.lineNumber, position.columnNumber);
    }
    merge(entry) {
        if (this.projectId !== entry.projectId || this.url !== entry.url) {
            return;
        }
        this.positionHandle = entry.positionHandle;
    }
    positionFromSelection(selection) {
        return { lineNumber: selection.endLine, columnNumber: selection.endColumn };
    }
    valid() {
        const position = this.positionHandle.resolve();
        const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCode(this.projectId, this.url);
        return Boolean(position && uiSourceCode);
    }
    reveal() {
        const position = this.positionHandle.resolve();
        const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCode(this.projectId, this.url);
        if (!position || !uiSourceCode) {
            return;
        }
        this.editingLocationManager.updateCurrentState();
        this.sourcesView.showSourceLocation(uiSourceCode, position.lineNumber, position.columnNumber);
    }
}
//# sourceMappingURL=EditingLocationHistoryManager.js.map