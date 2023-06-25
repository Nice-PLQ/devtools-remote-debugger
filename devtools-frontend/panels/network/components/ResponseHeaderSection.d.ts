import type * as SDK from '../../../core/sdk/sdk.js';
import * as NetworkForward from '../../../panels/network/forward/forward.js';
export declare const RESPONSE_HEADER_SECTION_DATA_KEY = "ResponseHeaderSection";
export interface ResponseHeaderSectionData {
    request: SDK.NetworkRequest.NetworkRequest;
    toReveal?: {
        section: NetworkForward.UIRequestLocation.UIHeaderSection;
        header?: string;
    };
}
export declare class ResponseHeaderSection extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
    set data(data: ResponseHeaderSectionData);
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-response-header-section': ResponseHeaderSection;
    }
}
