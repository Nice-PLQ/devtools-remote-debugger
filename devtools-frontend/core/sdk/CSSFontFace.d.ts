import type * as Protocol from '../../generated/protocol.js';
export declare class CSSFontFace {
    #private;
    constructor(payload: Protocol.CSS.FontFace);
    getFontFamily(): string;
    getVariationAxisByTag(tag: string): Protocol.CSS.FontVariationAxis | undefined;
}
