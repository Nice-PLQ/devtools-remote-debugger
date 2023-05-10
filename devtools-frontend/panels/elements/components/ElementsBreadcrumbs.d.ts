import type * as SDK from '../../../core/sdk/sdk.js';
import type { DOMNode } from './Helper.js';
export declare class NodeSelectedEvent extends Event {
    static readonly eventName = "breadcrumbsnodeselected";
    legacyDomNode: SDK.DOMModel.DOMNode;
    constructor(node: DOMNode);
}
export interface ElementsBreadcrumbsData {
    selectedNode: DOMNode | null;
    crumbs: DOMNode[];
}
export declare class ElementsBreadcrumbs extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private readonly resizeObserver;
    private crumbsData;
    private selectedDOMNode;
    private overflowing;
    private userScrollPosition;
    private isObservingResize;
    private userHasManuallyScrolled;
    connectedCallback(): void;
    set data(data: ElementsBreadcrumbsData);
    disconnectedCallback(): void;
    private onCrumbClick;
    private checkForOverflowOnResize;
    private update;
    private onCrumbMouseMove;
    private onCrumbMouseLeave;
    private onCrumbFocus;
    private onCrumbBlur;
    private engageResizeObserver;
    /**
     * This method runs after render and checks if the crumbs are too large for
     * their container and therefore we need to render the overflow buttons at
     * either end which the user can use to scroll back and forward through the crumbs.
     * If it finds that we are overflowing, it sets the instance variable and
     * triggers a re-render. If we are not overflowing, this method returns and
     * does nothing.
     */
    private checkForOverflow;
    private onCrumbsWindowScroll;
    private updateScrollState;
    private onOverflowClick;
    private renderOverflowButton;
    private render;
    private ensureSelectedNodeIsVisible;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-elements-breadcrumbs': ElementsBreadcrumbs;
    }
    interface HTMLElementEventMap {
        [NodeSelectedEvent.eventName]: NodeSelectedEvent;
    }
}
