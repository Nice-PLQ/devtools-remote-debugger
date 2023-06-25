/**
 * For animation shorthand, we can show two swatches:
 * - Easing function swatch (or also called bezier swatch)
 * - Animation name swatch
 * - Variable swatch
 * all the other tokens in the shorthands are rendered as text.
 *
 * This helper model takes an animation shorthand value (`1s linear slide-in`)
 * and finds out which parts to render as "what" by taking its syntax and parsing logic
 * into consideration. Details can be found here: https://w3c.github.io/csswg-drafts/css-animations/#animation.
 *
 * The rule says that whenever there is a keyword that is valid for a property other than
 * `animation-name` whose values are not found earlier in the shorthand must be accepted
 * for those properties rather than for `animation-name`.
 *
 * Beware that, an animation shorthand can contain multiple animation definitions that are
 * separated by a comma (The syntax is animation = <single-animation>#). The above rule only
 * applies to parsing of <single-animation>.
 */
export declare class CSSAnimationModel {
    parts: Part[];
    private constructor();
    static parse(text: string, animationNames: string[]): CSSAnimationModel;
}
export declare const enum PartType {
    Text = "T",
    EasingFunction = "EF",
    AnimationName = "AN",
    Variable = "V"
}
type Part = {
    type: PartType;
    value: string;
};
export {};
