import type { FormattedContentBuilder } from './FormattedContentBuilder.js';
export declare class JavaScriptFormatter {
    private readonly builder;
    private tokenizer;
    private content;
    private fromOffset;
    private lastLineNumber;
    private toOffset?;
    constructor(builder: FormattedContentBuilder);
    format(text: string, lineEndings: number[], fromOffset: number, toOffset: number): void;
    private push;
    private beforeVisit;
    private afterVisit;
    private inForLoopHeader;
    private formatToken;
    private finishNode;
}
