import * as UI from '../../legacy.js';
export declare class JavaScriptAutocomplete {
    private readonly expressionCache;
    private constructor();
    static instance(): JavaScriptAutocomplete;
    private clearCache;
    completionsForTextInCurrentContext(fullText: string, query: string, force?: boolean): Promise<UI.SuggestBox.Suggestions>;
    argumentsHint(fullText: string): Promise<{
        args: Array<Array<string>>;
        argumentIndex: number;
    } | null | undefined>;
    private argumentsForFunction;
    private mapCompletions;
    private completionsForExpression;
    private receivedPropertyNames;
    private completionsForQuery;
    private itemComparator;
    static isExpressionComplete(expression: string): Promise<boolean>;
}
export declare class JavaScriptAutocompleteConfig {
    private readonly editor;
    constructor(editor: UI.TextEditor.TextEditor);
    static createConfigForEditor(editor: UI.TextEditor.TextEditor): UI.SuggestBox.AutocompleteConfig;
    private substituteRange;
    private suggestionsCallback;
    private tooltipCallback;
}
export interface CompletionGroup {
    title?: string;
    items: string[];
}
