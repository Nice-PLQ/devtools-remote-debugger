import * as LitHtml from '../../../ui/lit-html/lit-html.js';
declare const LitElement: typeof LitHtml.LitElement;
declare global {
    interface HTMLElementTagNameMap {
        'devtools-recorder-input': RecorderInput;
        'devtools-editable-content': EditableContent;
        'devtools-suggestion-box': SuggestionBox;
    }
}
declare class EditableContent extends HTMLElement {
    #private;
    static get observedAttributes(): string[];
    set disabled(disabled: boolean);
    get disabled(): boolean;
    set value(value: string);
    get value(): string;
    set mimeType(type: string);
    get mimeType(): string;
    constructor();
    attributeChangedCallback(name: string, _: string | null, value: string | null): void;
}
/**
 * @fires SuggestionInitEvent#suggestioninit
 * @fires SuggestEvent#suggest
 */
declare class SuggestionBox extends LitElement {
    #private;
    static styles: CSSStyleSheet[];
    options: Readonly<string[]>;
    expression: string;
    private cursor;
    constructor();
    connectedCallback(): void;
    willUpdate(changedProperties: LitHtml.PropertyValues<this>): void;
    protected render(): LitHtml.TemplateResult | undefined;
}
export declare class RecorderInput extends LitElement {
    #private;
    static shadowRootOptions: {
        readonly delegatesFocus: true;
        readonly mode: ShadowRootMode;
        readonly slotAssignment?: SlotAssignmentMode | undefined;
    };
    static styles: CSSStyleSheet[];
    /**
     * State passed to devtools-suggestion-box.
     */
    options: Readonly<string[]>;
    expression: string;
    /**
     * State passed to devtools-editable-content.
     */
    placeholder: string;
    value: string;
    disabled: boolean;
    mimeType: string;
    constructor();
    protected willUpdate(properties: LitHtml.PropertyValues<this>): void;
    protected render(): LitHtml.TemplateResult;
}
export {};
