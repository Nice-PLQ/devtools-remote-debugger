export declare const enum Navigation {
    Backward = "Backward",
    Forward = "Forward"
}
export declare class AddressInputChangedEvent extends Event {
    static readonly eventName = "addressinputchanged";
    data: {
        address: string;
        mode: Mode;
    };
    constructor(address: string, mode: Mode);
}
export declare class PageNavigationEvent extends Event {
    static readonly eventName = "pagenavigation";
    data: Navigation;
    constructor(navigation: Navigation);
}
export declare class HistoryNavigationEvent extends Event {
    static readonly eventName = "historynavigation";
    data: Navigation;
    constructor(navigation: Navigation);
}
export declare class RefreshRequestedEvent extends Event {
    static readonly eventName = "refreshrequested";
    constructor();
}
export interface LinearMemoryNavigatorData {
    address: string;
    mode: Mode;
    canGoBackInHistory: boolean;
    canGoForwardInHistory: boolean;
    valid: boolean;
    error: string | undefined;
}
export declare const enum Mode {
    Edit = "Edit",
    Submitted = "Submitted",
    InvalidSubmit = "InvalidSubmit"
}
export declare class LinearMemoryNavigator extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private address;
    private error;
    private valid;
    private canGoBackInHistory;
    private canGoForwardInHistory;
    connectedCallback(): void;
    set data(data: LinearMemoryNavigatorData);
    private render;
    private createAddressInput;
    private onAddressChange;
    private createButton;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-linear-memory-inspector-navigator': LinearMemoryNavigator;
    }
}
