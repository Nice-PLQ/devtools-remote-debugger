import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
export declare function completion(): Promise<CodeMirror.Extension>;
export declare const enum QueryType {
    Expression = 0,
    PropertyName = 1,
    PropertyExpression = 2
}
export declare function getQueryType(tree: CodeMirror.Tree, pos: number): {
    type: QueryType;
    from?: number;
    relatedNode?: CodeMirror.SyntaxNode;
} | null;
export declare function javascriptCompletionSource(cx: CodeMirror.CompletionContext): Promise<CodeMirror.CompletionResult | null>;
export declare function isExpressionComplete(state: CodeMirror.EditorState): boolean;
export declare function argumentHints(): CodeMirror.Extension;
