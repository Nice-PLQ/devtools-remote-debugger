import type * as TextEditor from '../../ui/components/text_editor/text_editor.js';
import type * as CodeMirror from '../../third_party/codemirror.next/codemirror.next.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class BreakpointEditDialog extends UI.Widget.Widget {
    readonly modCodeMirror: typeof CodeMirror;
    private readonly onFinish;
    private finished;
    private editor;
    private isLogpoint;
    private readonly typeSelector;
    private placeholderCompartment;
    static create(editorLineNumber: number, oldCondition: string, preferLogpoint: boolean, onFinish: (arg0: {
        committed: boolean;
        condition: string;
    }) => Promise<void>): Promise<BreakpointEditDialog>;
    constructor(editorLineNumber: number, oldCondition: string, preferLogpoint: boolean, onFinish: (arg0: {
        committed: boolean;
        condition: string;
    }) => Promise<void>, modTextEditor: typeof TextEditor, modCodeMirror: typeof CodeMirror, editorConfig: CodeMirror.Extension);
    focusEditor(): void;
    private static conditionForLogpoint;
    private onTypeChanged;
    private get breakpointType();
    private getPlaceholder;
    private updateTooltip;
    private finishEditing;
    wasShown(): void;
}
export declare const LogpointPrefix = "/** DEVTOOLS_LOGPOINT */ console.log(";
export declare const LogpointSuffix = ")";
export declare const BreakpointType: {
    Breakpoint: string;
    Conditional: string;
    Logpoint: string;
};
