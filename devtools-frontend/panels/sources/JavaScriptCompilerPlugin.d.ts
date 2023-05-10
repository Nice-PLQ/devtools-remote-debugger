import * as Workspace from '../../models/workspace/workspace.js';
import type * as SourceFrame from '../../ui/legacy/components/source_frame/source_frame.js';
import { Plugin } from './Plugin.js';
export declare class JavaScriptCompilerPlugin extends Plugin {
    private readonly textEditor;
    private uiSourceCode;
    private compiling;
    private recompileScheduled;
    private timeout;
    private message;
    private disposed;
    constructor(textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor, uiSourceCode: Workspace.UISourceCode.UISourceCode);
    static accepts(uiSourceCode: Workspace.UISourceCode.UISourceCode): boolean;
    private scheduleCompile;
    private findRuntimeModel;
    private compile;
    private compilationFinishedForTest;
    dispose(): void;
}
export declare const CompileDelay = 1000;
