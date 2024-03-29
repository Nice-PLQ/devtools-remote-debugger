import type * as Platform from '../platform/platform.js';
export declare abstract class Revealer {
    abstract reveal(object: Object, omitFocus?: boolean): Promise<void>;
}
export declare let reveal: (revealable: Object | null, omitFocus?: boolean) => Promise<void>;
export declare function setRevealForTest(newReveal: (arg0: Object | null, arg1?: boolean | undefined) => Promise<void>): void;
export declare const revealDestination: (revealable: Object | null) => string | null;
export declare function registerRevealer(registration: RevealerRegistration): void;
export interface RevealerRegistration {
    contextTypes: () => Array<Function>;
    loadRevealer: () => Promise<Revealer>;
    destination?: RevealerDestination;
}
export declare const RevealerDestination: {
    ELEMENTS_PANEL: () => Platform.UIString.LocalizedString;
    STYLES_SIDEBAR: () => Platform.UIString.LocalizedString;
    CHANGES_DRAWER: () => Platform.UIString.LocalizedString;
    ISSUES_VIEW: () => Platform.UIString.LocalizedString;
    NETWORK_PANEL: () => Platform.UIString.LocalizedString;
    APPLICATION_PANEL: () => Platform.UIString.LocalizedString;
    SOURCES_PANEL: () => Platform.UIString.LocalizedString;
};
export type RevealerDestination = () => Platform.UIString.LocalizedString;
