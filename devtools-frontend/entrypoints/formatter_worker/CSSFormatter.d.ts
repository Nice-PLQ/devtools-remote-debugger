import type { FormattedContentBuilder } from './FormattedContentBuilder.js';
export declare class CSSFormatter {
    private readonly builder;
    private toOffset;
    private fromOffset;
    private lineEndings;
    private lastLine;
    private state;
    constructor(builder: FormattedContentBuilder);
    format(text: string, lineEndings: number[], fromOffset: number, toOffset: number): void;
    private tokenCallback;
}
