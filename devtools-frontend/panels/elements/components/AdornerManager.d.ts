export declare const enum AdornerCategories {
    SECURITY = "Security",
    LAYOUT = "Layout",
    DEFAULT = "Default"
}
export interface AdornerSetting {
    adorner: string;
    isEnabled: boolean;
}
export declare type AdornerSettingsMap = Map<string, boolean>;
export interface RegisteredAdorner {
    readonly name: string;
    readonly category: AdornerCategories;
    readonly enabledByDefault: boolean;
}
export declare enum RegisteredAdorners {
    GRID = "grid",
    FLEX = "flex",
    AD = "ad",
    SCROLL_SNAP = "scroll-snap",
    CONTAINER = "container"
}
export declare function getRegisteredAdorner(which: RegisteredAdorners): RegisteredAdorner;
export declare const DefaultAdornerSettings: AdornerSetting[];
interface SettingStore<Setting> {
    get(): Setting;
    set(setting: Setting): void;
}
export declare class AdornerManager {
    private adornerSettings;
    private settingStore;
    constructor(settingStore: SettingStore<AdornerSetting[]>);
    updateSettings(settings: AdornerSettingsMap): void;
    getSettings(): Readonly<AdornerSettingsMap>;
    isAdornerEnabled(adornerText: string): boolean;
    private persistCurrentSettings;
    private loadSettings;
    private syncSettings;
}
export declare const AdornerCategoryOrder: Map<AdornerCategories, number>;
export declare function compareAdornerNamesByCategory(nameA: string, nameB: string): number;
export {};
