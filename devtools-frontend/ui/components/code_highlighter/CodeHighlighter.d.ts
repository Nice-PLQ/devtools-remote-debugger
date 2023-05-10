import type * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
export declare function getHighlightStyle(modCM: typeof CodeMirror): CodeMirror.HighlightStyle;
export declare function create(code: string, mimeType: string): Promise<CodeHighlighter>;
export declare function highlightNode(node: Element, mimeType: string): Promise<void>;
export declare function languageFromMIME(mimeType: string): Promise<CodeMirror.LanguageSupport | null>;
export declare class CodeHighlighter {
    readonly code: string;
    readonly tree: CodeMirror.Tree;
    private readonly modCM;
    constructor(code: string, tree: CodeMirror.Tree, modCM: typeof CodeMirror);
    highlight(token: (text: string, style: string) => void): void;
    highlightRange(from: number, to: number, token: (text: string, style: string) => void): void;
}
