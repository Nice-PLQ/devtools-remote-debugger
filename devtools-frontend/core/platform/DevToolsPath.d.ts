declare class UrlStringTag {
    private urlTag;
}
/**
 * File paths in DevTools that are represented as URLs
 * @example
 * “file:///Hello%20World/file/js”
 */
export declare type UrlString = string & UrlStringTag;
declare class RawPathStringTag {
    private rawPathTag;
}
/**
 * File paths in DevTools that are represented as unencoded absolute
 * or relative paths
 * @example
 * “/Hello World/file.js”
 */
export declare type RawPathString = string & RawPathStringTag;
declare class EncodedPathStringTag {
    private encodedPathTag;
}
/**
 * File paths in DevTools that are represented as encoded paths
 * @example
 * “/Hello%20World/file.js”
 */
export declare type EncodedPathString = string & EncodedPathStringTag;
export {};
