export interface TextPromptData {
    ariaLabel: string;
    prefix: string;
    suggestion: string;
}
export declare class PromptInputEvent extends Event {
    static readonly eventName = "promptinputchanged";
    data: string;
    constructor(value: string);
}
export declare class TextPrompt extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private ariaLabelText;
    private prefixText;
    private suggestionText;
    connectedCallback(): void;
    set data(data: TextPromptData);
    get data(): TextPromptData;
    focus(): void;
    private input;
    moveCaretToEndOfInput(): void;
    onInput(): void;
    onKeyDown(event: KeyboardEvent): void;
    setSelectedRange(startIndex: number, endIndex: number): void;
    setPrefix(prefix: string): void;
    setSuggestion(suggestion: string): void;
    setText(text: string): void;
    private suggestion;
    private text;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-text-prompt': TextPrompt;
    }
    interface HTMLElementEventMap {
        'promptinputchanged': PromptInputEvent;
    }
}
