import type * as Protocol from '../../generated/protocol.js';
import type { CSSModel } from './CSSModel.js';
import type { CSSProperty } from './CSSProperty.js';
import { CSSKeyframesRule, CSSStyleRule } from './CSSRule.js';
import { CSSStyleDeclaration } from './CSSStyleDeclaration.js';
import type { DOMNode } from './DOMModel.js';
export declare class CSSMatchedStyles {
    #private;
    constructor(cssModel: CSSModel, node: DOMNode, inlinePayload: Protocol.CSS.CSSStyle | null, attributesPayload: Protocol.CSS.CSSStyle | null, matchedPayload: Protocol.CSS.RuleMatch[], pseudoPayload: Protocol.CSS.PseudoElementMatches[], inheritedPayload: Protocol.CSS.InheritedStyleEntry[], animationsPayload: Protocol.CSS.CSSKeyframesRule[]);
    private buildMainCascade;
    private buildPseudoCascades;
    private addMatchingSelectors;
    node(): DOMNode;
    cssModel(): CSSModel;
    hasMatchingSelectors(rule: CSSStyleRule): boolean;
    getMatchingSelectors(rule: CSSStyleRule): number[];
    recomputeMatchingSelectors(rule: CSSStyleRule): Promise<void>;
    addNewRule(rule: CSSStyleRule, node: DOMNode): Promise<void>;
    private setSelectorMatches;
    mediaMatches(style: CSSStyleDeclaration): boolean;
    nodeStyles(): CSSStyleDeclaration[];
    keyframes(): CSSKeyframesRule[];
    pseudoStyles(pseudoType: Protocol.DOM.PseudoType): CSSStyleDeclaration[];
    pseudoTypes(): Set<Protocol.DOM.PseudoType>;
    private containsInherited;
    nodeForStyle(style: CSSStyleDeclaration): DOMNode | null;
    availableCSSVariables(style: CSSStyleDeclaration): string[];
    computeCSSVariable(style: CSSStyleDeclaration, variableName: string): string | null;
    computeValue(style: CSSStyleDeclaration, value: string): string | null;
    /**
     * Same as computeValue, but to be used for `var(--#name [,...])` values only
     */
    computeSingleVariableValue(style: CSSStyleDeclaration, cssVariableValue: string): {
        computedValue: string | null;
        fromFallback: boolean;
    } | null;
    isInherited(style: CSSStyleDeclaration): boolean;
    propertyState(property: CSSProperty): PropertyState | null;
    resetActiveProperties(): void;
}
export declare enum PropertyState {
    Active = "Active",
    Overloaded = "Overloaded"
}
