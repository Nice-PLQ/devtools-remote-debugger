import * as Common from '../../../core/common/common.js';
export declare class ThemeSupport {
    private readonly themeNameInternal;
    private themableProperties;
    private readonly cachedThemePatches;
    private readonly setting;
    private readonly customSheets;
    private readonly computedRoot;
    private injectingStyleSheet?;
    private constructor();
    static hasInstance(): boolean;
    static instance(opts?: {
        forceNew: boolean | null;
        setting: Common.Settings.Setting<string> | null;
    }): ThemeSupport;
    getComputedValue(variableName: string): string;
    hasTheme(): boolean;
    themeName(): string;
    injectHighlightStyleSheets(element: Element | ShadowRoot): void;
    /**
     * Note: this is a duplicate of the function in ui/utils. It exists here
     * so there is no circular dependency between ui/utils and theme_support.
     */
    private appendStyle;
    injectCustomStyleSheets(element: Element | ShadowRoot): void;
    isForcedColorsMode(): boolean;
    addCustomStylesheet(sheetText: string): void;
    applyTheme(document: Document): void;
    themeStyleSheet(id: string, text: string): string;
    private patchForTheme;
    /**
     * Theming API is primarily targeted at making dark theme look good.
     * - If rule has ".-theme-preserve" in selector, it won't be affected.
     * - One can create specializations for dark themes via body.-theme-with-dark-background selector in host context.
     */
    private patchProperty;
    patchColorText(text: string, colorUsage: number): string;
    patchColor(color: Common.Color.Color, colorUsage: number): Common.Color.Color;
    private patchHSLA;
}
export declare namespace ThemeSupport {
    enum ColorUsage {
        Unknown = 0,
        Foreground = 1,
        Background = 2
    }
}
