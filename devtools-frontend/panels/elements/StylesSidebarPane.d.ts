import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as InlineEditor from '../../ui/legacy/components/inline_editor/inline_editor.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import type { ComputedStyleChangedEvent } from './ComputedStyleModel.js';
import { ElementsSidebarPane } from './ElementsSidebarPane.js';
import type { Context } from './StylePropertyTreeElement.js';
import { StylePropertyTreeElement } from './StylePropertyTreeElement.js';
declare const StylesSidebarPane_base: (new (...args: any[]) => {
    "__#8@#events": Common.ObjectWrapper.ObjectWrapper<EventTypes>;
    addEventListener<T extends keyof EventTypes>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T]>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<EventTypes, T>;
    once<T_1 extends keyof EventTypes>(eventType: T_1): Promise<EventTypes[T_1]>;
    removeEventListener<T_2 extends keyof EventTypes>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T_2]>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: keyof EventTypes): boolean;
    dispatchEventToListeners<T_3 extends keyof EventTypes>(eventType: Platform.TypeScriptUtilities.NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<EventTypes, T_3>): void;
}) & typeof ElementsSidebarPane;
export declare class StylesSidebarPane extends StylesSidebarPane_base {
    private currentToolbarPane;
    private animatedToolbarPane;
    private pendingWidget;
    private pendingWidgetToggle;
    private toolbar;
    private toolbarPaneElement;
    private noMatchesElement;
    private sectionsContainer;
    sectionByElement: WeakMap<Node, StylePropertiesSection>;
    private readonly swatchPopoverHelperInternal;
    readonly linkifier: Components.Linkifier.Linkifier;
    private readonly decorator;
    private lastRevealedProperty;
    private userOperation;
    isEditingStyle: boolean;
    private filterRegexInternal;
    private isActivePropertyHighlighted;
    private initialUpdateCompleted;
    hasMatchedStyles: boolean;
    private sectionBlocks;
    private idleCallbackManager;
    private needsForceUpdate;
    private readonly resizeThrottler;
    private readonly imagePreviewPopover;
    activeCSSAngle: InlineEditor.CSSAngle.CSSAngle | null;
    static instance(): StylesSidebarPane;
    private constructor();
    swatchPopoverHelper(): InlineEditor.SwatchPopoverHelper.SwatchPopoverHelper;
    setUserOperation(userOperation: boolean): void;
    static createExclamationMark(property: SDK.CSSProperty.CSSProperty, title: string | null): Element;
    static ignoreErrorsForProperty(property: SDK.CSSProperty.CSSProperty): boolean;
    static createPropertyFilterElement(placeholder: string, container: Element, filterCallback: (arg0: RegExp | null) => void): Element;
    static formatLeadingProperties(section: StylePropertiesSection): {
        allDeclarationText: string;
        ruleText: string;
    };
    revealProperty(cssProperty: SDK.CSSProperty.CSSProperty): void;
    jumpToProperty(propertyName: string): void;
    forceUpdate(): void;
    private sectionsContainerKeyDown;
    private sectionsContainerFocusChanged;
    resetFocus(): void;
    onAddButtonLongClick(event: Event): void;
    private onFilterChanged;
    refreshUpdate(editedSection: StylePropertiesSection, editedTreeElement?: StylePropertyTreeElement): void;
    doUpdate(): Promise<void>;
    onResize(): void;
    private innerResize;
    private resetCache;
    private fetchMatchedCascade;
    setEditingStyle(editing: boolean, _treeElement?: StylePropertyTreeElement): void;
    setActiveProperty(treeElement: StylePropertyTreeElement | null): void;
    onCSSModelChanged(event: Common.EventTarget.EventTargetEvent<ComputedStyleChangedEvent>): void;
    focusedSectionIndex(): number;
    continueEditingElement(sectionIndex: number, propertyIndex: number): void;
    private innerRebuildUpdate;
    private nodeStylesUpdatedForTest;
    private rebuildSectionsForMatchedStyleRules;
    createNewRuleInViaInspectorStyleSheet(): Promise<void>;
    private createNewRuleInStyleSheet;
    addBlankSection(insertAfterSection: StylePropertiesSection, styleSheetId: Protocol.CSS.StyleSheetId, ruleLocation: TextUtils.TextRange.TextRange): void;
    removeSection(section: StylePropertiesSection): void;
    filterRegex(): RegExp | null;
    private updateFilter;
    willHide(): void;
    hideAllPopovers(): void;
    allSections(): StylePropertiesSection[];
    private clipboardCopy;
    private createStylesSidebarToolbar;
    showToolbarPane(widget: UI.Widget.Widget | null, toggle: UI.Toolbar.ToolbarToggle | null): void;
    appendToolbarItem(item: UI.Toolbar.ToolbarItem): void;
    private startToolbarPaneAnimation;
}
export declare const enum Events {
    InitialUpdateCompleted = "InitialUpdateCompleted",
    StylesUpdateCompleted = "StylesUpdateCompleted"
}
export interface StylesUpdateCompletedEvent {
    hasMatchedStyles: boolean;
}
export declare type EventTypes = {
    [Events.InitialUpdateCompleted]: void;
    [Events.StylesUpdateCompleted]: StylesUpdateCompletedEvent;
};
export declare const _maxLinkLength = 23;
export declare class SectionBlock {
    private readonly titleElementInternal;
    sections: StylePropertiesSection[];
    constructor(titleElement: Element | null);
    static createPseudoTypeBlock(pseudoType: Protocol.DOM.PseudoType): SectionBlock;
    static createKeyframesBlock(keyframesName: string): SectionBlock;
    static createInheritedNodeBlock(node: SDK.DOMModel.DOMNode): Promise<SectionBlock>;
    updateFilter(): boolean;
    titleElement(): Element | null;
}
export declare class IdleCallbackManager {
    private discarded;
    private readonly promises;
    constructor();
    discard(): void;
    schedule(fn: () => void, timeout?: number): void;
    awaitDone(): Promise<void[]>;
}
export declare class StylePropertiesSection {
    protected parentPane: StylesSidebarPane;
    styleInternal: SDK.CSSStyleDeclaration.CSSStyleDeclaration;
    readonly matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles;
    editable: boolean;
    private hoverTimer;
    private willCauseCancelEditing;
    private forceShowAll;
    private readonly originalPropertiesCount;
    element: HTMLDivElement;
    private readonly innerElement;
    private readonly titleElement;
    propertiesTreeOutline: UI.TreeOutline.TreeOutlineInShadow;
    private showAllButton;
    protected selectorElement: HTMLSpanElement;
    private readonly newStyleRuleToolbar;
    private readonly fontEditorToolbar;
    private readonly fontEditorSectionManager;
    private readonly fontEditorButton;
    private selectedSinceMouseDown;
    private readonly elementToSelectorIndex;
    navigable: boolean | null | undefined;
    protected readonly selectorRefElement: HTMLElement;
    private readonly selectorContainer;
    private readonly fontPopoverIcon;
    private hoverableSelectorsMode;
    private isHiddenInternal;
    private queryListElement;
    constructor(parentPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, style: SDK.CSSStyleDeclaration.CSSStyleDeclaration);
    registerFontProperty(treeElement: StylePropertyTreeElement): void;
    resetToolbars(): void;
    static createRuleOriginNode(matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, linkifier: Components.Linkifier.Linkifier, rule: SDK.CSSRule.CSSRule | null): Node;
    private static getRuleLocationFromCSSRule;
    static tryNavigateToRuleLocation(matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, rule: SDK.CSSRule.CSSRule | null): void;
    protected static linkifyRuleLocation(cssModel: SDK.CSSModel.CSSModel, linkifier: Components.Linkifier.Linkifier, styleSheetId: Protocol.CSS.StyleSheetId, ruleLocation: TextUtils.TextRange.TextRange): Node;
    private static getCSSSelectorLocation;
    private getFocused;
    private focusNext;
    private ruleNavigation;
    private onKeyDown;
    private setSectionHovered;
    private onMouseLeave;
    private onMouseMove;
    private onFontEditorButtonClicked;
    style(): SDK.CSSStyleDeclaration.CSSStyleDeclaration;
    headerText(): string;
    private onMouseOutSelector;
    private onMouseEnterSelector;
    highlight(mode?: string | undefined): void;
    firstSibling(): StylePropertiesSection | null;
    findCurrentOrNextVisible(willIterateForward: boolean, originalSection?: StylePropertiesSection): StylePropertiesSection | null;
    lastSibling(): StylePropertiesSection | null;
    nextSibling(): StylePropertiesSection | undefined;
    previousSibling(): StylePropertiesSection | undefined;
    private onNewRuleClick;
    styleSheetEdited(edit: SDK.CSSModel.Edit): void;
    protected createMediaList(mediaRules: SDK.CSSMedia.CSSMedia[]): void;
    protected createContainerQueryList(containerQueries: SDK.CSSContainerQuery.CSSContainerQuery[]): void;
    private addContainerForContainerQuery;
    private updateQueryList;
    isPropertyInherited(propertyName: string): boolean;
    nextEditableSibling(): StylePropertiesSection | null;
    previousEditableSibling(): StylePropertiesSection | null;
    refreshUpdate(editedTreeElement: StylePropertyTreeElement): void;
    updateVarFunctions(editedTreeElement: StylePropertyTreeElement): void;
    update(full: boolean): void;
    private showAllItems;
    onpopulate(): void;
    isPropertyOverloaded(property: SDK.CSSProperty.CSSProperty): boolean;
    updateFilter(): boolean;
    isHidden(): boolean;
    markSelectorMatches(): void;
    private renderHoverableSelectors;
    private createSelectorElement;
    private renderSimplifiedSelectors;
    markSelectorHighlights(): void;
    private checkWillCancelEditing;
    private handleSelectorContainerClick;
    addNewBlankProperty(index?: number | undefined): StylePropertyTreeElement;
    private handleEmptySpaceMouseDown;
    private handleEmptySpaceClick;
    private handleQueryRuleClick;
    private editingMediaFinished;
    private editingMediaCancelled;
    private editingMediaBlurHandler;
    private editingMediaCommitted;
    private editingMediaTextCommittedForTest;
    private handleSelectorClick;
    private handleContextMenuEvent;
    private navigateToSelectorSource;
    private static revealSelectorSource;
    private startEditingAtFirstPosition;
    startEditingSelector(): void;
    moveEditorFromSelector(moveDirection: string): void;
    editingSelectorCommitted(element: Element, newContent: string, oldContent: string, context: Context | undefined, moveDirection: string): void;
    setHeaderText(rule: SDK.CSSRule.CSSRule, newContent: string): Promise<void>;
    protected editingSelectorCommittedForTest(): void;
    protected updateRuleOrigin(): void;
    protected editingSelectorEnded(): void;
    editingSelectorCancelled(): void;
    /**
     * A property at or near an index and suitable for subsequent editing.
     * Either the last property, if index out-of-upper-bound,
     * or property at index, if such a property exists,
     * or otherwise, null.
     */
    closestPropertyForEditing(propertyIndex: number): UI.TreeOutline.TreeElement | null;
    static MaxProperties: number;
}
export declare class BlankStylePropertiesSection extends StylePropertiesSection {
    private normal;
    private readonly ruleLocation;
    private readonly styleSheetId;
    constructor(stylesPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, defaultSelectorText: string, styleSheetId: Protocol.CSS.StyleSheetId, ruleLocation: TextUtils.TextRange.TextRange, insertAfterStyle: SDK.CSSStyleDeclaration.CSSStyleDeclaration);
    private actualRuleLocation;
    private rulePrefix;
    get isBlank(): boolean;
    editingSelectorCommitted(element: Element, newContent: string, oldContent: string, context: Context | undefined, moveDirection: string): void;
    editingSelectorCancelled(): void;
    private makeNormal;
}
export declare class KeyframePropertiesSection extends StylePropertiesSection {
    constructor(stylesPane: StylesSidebarPane, matchedStyles: SDK.CSSMatchedStyles.CSSMatchedStyles, style: SDK.CSSStyleDeclaration.CSSStyleDeclaration);
    headerText(): string;
    setHeaderText(rule: SDK.CSSRule.CSSRule, newContent: string): Promise<void>;
    isPropertyInherited(_propertyName: string): boolean;
    isPropertyOverloaded(_property: SDK.CSSProperty.CSSProperty): boolean;
    markSelectorHighlights(): void;
    markSelectorMatches(): void;
    highlight(): void;
}
export declare function quoteFamilyName(familyName: string): string;
export declare class CSSPropertyPrompt extends UI.TextPrompt.TextPrompt {
    private readonly isColorAware;
    private readonly cssCompletions;
    private selectedNodeComputedStyles;
    private parentNodeComputedStyles;
    private treeElement;
    private isEditingName;
    private readonly cssVariables;
    constructor(treeElement: StylePropertyTreeElement, isEditingName: boolean);
    onKeyDown(event: Event): void;
    onMouseWheel(event: Event): void;
    tabKeyPressed(): boolean;
    private handleNameOrValueUpDown;
    private isValueSuggestion;
    private buildPropertyCompletions;
}
export declare function unescapeCssString(input: string): string;
export declare class StylesSidebarPropertyRenderer {
    private rule;
    private node;
    private propertyName;
    private propertyValue;
    private colorHandler;
    private bezierHandler;
    private fontHandler;
    private shadowHandler;
    private gridHandler;
    private varHandler;
    private angleHandler;
    private lengthHandler;
    constructor(rule: SDK.CSSRule.CSSRule | null, node: SDK.DOMModel.DOMNode | null, name: string, value: string);
    setColorHandler(handler: (arg0: string) => Node): void;
    setBezierHandler(handler: (arg0: string) => Node): void;
    setFontHandler(handler: (arg0: string) => Node): void;
    setShadowHandler(handler: (arg0: string, arg1: string) => Node): void;
    setGridHandler(handler: (arg0: string, arg1: string) => Node): void;
    setVarHandler(handler: (arg0: string) => Node): void;
    setAngleHandler(handler: (arg0: string) => Node): void;
    setLengthHandler(handler: (arg0: string) => Node): void;
    renderName(): Element;
    renderValue(): Element;
    private processURL;
}
export declare class ButtonProvider implements UI.Toolbar.Provider {
    private readonly button;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): ButtonProvider;
    private clicked;
    private longClicked;
    item(): UI.Toolbar.ToolbarItem;
}
export {};
