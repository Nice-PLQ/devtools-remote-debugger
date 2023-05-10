import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
declare global {
    interface HTMLElementTagNameMap {
        'devtools-text-editor': TextEditor;
    }
}
export declare class TextEditor extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private activeEditor;
    private activeSettingListeners;
    private pendingState;
    constructor(pendingState?: CodeMirror.EditorState);
    private createEditor;
    get editor(): CodeMirror.EditorView;
    get state(): CodeMirror.EditorState;
    set state(state: CodeMirror.EditorState);
    connectedCallback(): void;
    disconnectedCallback(): void;
    private updateDynamicSettings;
    private registerSettingHandlers;
    revealPosition(position: number): void;
}
