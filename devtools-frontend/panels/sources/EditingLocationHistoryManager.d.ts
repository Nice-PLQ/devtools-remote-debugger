import * as Common from '../../core/common/common.js';
import type * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import type { SourcesView } from './SourcesView.js';
import type { UISourceCodeFrame } from './UISourceCodeFrame.js';
export declare class EditingLocationHistoryManager {
    private readonly sourcesView;
    private readonly historyManager;
    private readonly currentSourceFrameCallback;
    constructor(sourcesView: SourcesView, currentSourceFrameCallback: () => UISourceCodeFrame | null);
    trackSourceFrameCursorJumps(sourceFrame: UISourceCodeFrame): void;
    private onJumpHappened;
    rollback(): void;
    rollover(): void;
    updateCurrentState(): void;
    pushNewState(): void;
    private updateActiveState;
    private pushActiveState;
    removeHistoryForSourceCode(uiSourceCode: Workspace.UISourceCode.UISourceCode): void;
}
export declare const HistoryDepth = 20;
export declare class EditingLocationHistoryEntry implements Common.SimpleHistoryManager.HistoryEntry {
    private readonly sourcesView;
    private readonly editingLocationManager;
    readonly projectId: string;
    readonly url: string;
    private positionHandle;
    constructor(sourcesView: SourcesView, editingLocationManager: EditingLocationHistoryManager, sourceFrame: UISourceCodeFrame, selection: TextUtils.TextRange.TextRange);
    merge(entry: EditingLocationHistoryEntry): void;
    private positionFromSelection;
    valid(): boolean;
    reveal(): void;
}
