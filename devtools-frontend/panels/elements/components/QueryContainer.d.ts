import * as SDK from '../../../core/sdk/sdk.js';
import type { DOMNode } from './Helper.js';
export declare class QueriedSizeRequestedEvent extends Event {
    static readonly eventName = "queriedsizerequested";
    constructor();
}
export interface QueryContainerData {
    container: DOMNode;
    queryName?: string;
    onContainerLinkClick: (event: Event) => void;
}
export declare class QueryContainer extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private queryName?;
    private container?;
    private onContainerLinkClick?;
    private isContainerLinkHovered;
    private queriedSizeDetails?;
    set data(data: QueryContainerData);
    connectedCallback(): void;
    updateContainerQueriedSizeDetails(details: SDK.CSSContainerQuery.ContainerQueriedSizeDetails): void;
    private onContainerLinkMouseEnter;
    private onContainerLinkMouseLeave;
    private render;
    private renderQueriedSizeDetails;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-query-container': QueryContainer;
    }
}
