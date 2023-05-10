import type { FormattedContentBuilder } from './FormattedContentBuilder.js';
export declare class HTMLFormatter {
    private readonly builder;
    private readonly jsFormatter;
    private readonly cssFormatter;
    private text?;
    private lineEndings?;
    private model?;
    constructor(builder: FormattedContentBuilder);
    format(text: string, lineEndings: number[]): void;
    private formatTokensTill;
    private walk;
    private beforeOpenTag;
    private afterOpenTag;
    private beforeCloseTag;
    private afterCloseTag;
    private formatToken;
    private scriptTagIsJavaScript;
    static readonly SupportedJavaScriptMimeTypes: Set<string>;
}
export declare class HTMLModel {
    private state;
    private readonly documentInternal;
    private stack;
    private readonly tokens;
    private tokenIndex;
    private attributes;
    private attributeName;
    private tagName;
    private isOpenTag;
    private tagStartOffset?;
    private tagEndOffset?;
    constructor(text: string);
    private build;
    private updateDOM;
    private onStartTag;
    private onEndTag;
    private onTagComplete;
    private popElement;
    private pushElement;
    peekToken(): Token | null;
    nextToken(): Token | null;
    document(): FormatterElement;
}
declare class Token {
    value: string;
    type: Set<string>;
    startOffset: number;
    endOffset: number;
    constructor(value: string, type: Set<string>, startOffset: number, endOffset: number);
}
declare class Tag {
    name: string;
    startOffset: number;
    endOffset: number;
    attributes: Map<string, string>;
    isOpenTag: boolean;
    selfClosingTag: boolean;
    constructor(name: string, startOffset: number, endOffset: number, attributes: Map<string, string>, isOpenTag: boolean, selfClosingTag: boolean);
}
declare class FormatterElement {
    name: string;
    children: FormatterElement[];
    parent: FormatterElement | null;
    openTag: Tag | null;
    closeTag: Tag | null;
    constructor(name: string);
}
export {};
