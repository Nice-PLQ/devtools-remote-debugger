import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Common from '../common/common.js';
import type { PageResourceLoadInitiator } from './PageResourceLoader.js';
export interface SourceMap {
    compiledURL(): string;
    url(): string;
    sourceURLs(): string[];
    sourceContentProvider(sourceURL: string, contentType: Common.ResourceType.ResourceType): TextUtils.ContentProvider.ContentProvider;
    embeddedContentByURL(sourceURL: string): string | null;
    findEntry(lineNumber: number, columnNumber: number): SourceMapEntry | null;
    findReverseRanges(sourceURL: string, lineNumber: number, columnNumber: number): TextUtils.TextRange.TextRange[];
    sourceLineMapping(sourceURL: string, lineNumber: number, columnNumber: number): SourceMapEntry | null;
    mappings(): SourceMapEntry[];
    mapsOrigin(): boolean;
}
export declare class SourceMapV3 {
    version: number;
    file: string | undefined;
    sources: string[];
    sections: Section[] | undefined;
    mappings: string;
    sourceRoot: string | undefined;
    names: string[] | undefined;
    sourcesContent: string | undefined;
    constructor();
}
export declare class Section {
    map: SourceMapV3;
    offset: Offset;
    url: string | undefined;
    constructor();
}
export declare class Offset {
    line: number;
    column: number;
    constructor();
}
export declare class SourceMapEntry {
    lineNumber: number;
    columnNumber: number;
    sourceURL: string | undefined;
    sourceLineNumber: number;
    sourceColumnNumber: number;
    name: string | undefined;
    constructor(lineNumber: number, columnNumber: number, sourceURL?: string, sourceLineNumber?: number, sourceColumnNumber?: number, name?: string);
    static compare(entry1: SourceMapEntry, entry2: SourceMapEntry): number;
}
export declare class TextSourceMap implements SourceMap {
    #private;
    /**
     * Implements Source Map V3 model. See https://github.com/google/closure-compiler/wiki/Source-Maps
     * for format description.
     */
    constructor(compiledURL: string, sourceMappingURL: string, payload: SourceMapV3, initiator: PageResourceLoadInitiator);
    /**
     * @throws {!Error}
     */
    static load(sourceMapURL: string, compiledURL: string, initiator: PageResourceLoadInitiator): Promise<TextSourceMap>;
    compiledURL(): string;
    url(): string;
    sourceURLs(): string[];
    sourceContentProvider(sourceURL: string, contentType: Common.ResourceType.ResourceType): TextUtils.ContentProvider.ContentProvider;
    embeddedContentByURL(sourceURL: string): string | null;
    findEntry(lineNumber: number, columnNumber: number): SourceMapEntry | null;
    sourceLineMapping(sourceURL: string, lineNumber: number, columnNumber: number): SourceMapEntry | null;
    private findReverseIndices;
    findReverseEntries(sourceURL: string, lineNumber: number, columnNumber: number): SourceMapEntry[];
    findReverseRanges(sourceURL: string, lineNumber: number, columnNumber: number): TextUtils.TextRange.TextRange[];
    mappings(): SourceMapEntry[];
    private reversedMappings;
    private eachSection;
    private parseSources;
    private parseMap;
    private isSeparator;
    private decodeVLQ;
    reverseMapTextRange(url: string, textRange: TextUtils.TextRange.TextRange): TextUtils.TextRange.TextRange | null;
    mapsOrigin(): boolean;
}
export declare namespace TextSourceMap {
    const _VLQ_BASE_SHIFT = 5;
    const _VLQ_BASE_MASK: number;
    const _VLQ_CONTINUATION_MASK: number;
    class StringCharIterator {
        private readonly string;
        private position;
        constructor(string: string);
        next(): string;
        peek(): string;
        hasNext(): boolean;
    }
    class SourceInfo {
        content: string | null;
        reverseMappings: number[] | null;
        constructor(content: string | null, reverseMappings: number[] | null);
    }
}
