// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Components from '../../ui/legacy/components/utils/utils.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';
import { ImagePreviewPopover } from './ImagePreviewPopover.js';
import { unescapeCssString } from './StylesSidebarPane.js';
const UIStrings = {
    /**
     *@description Text that is announced by the screen reader when the user focuses on an input field for entering the name of a CSS property in the Styles panel
     *@example {margin} PH1
     */
    cssPropertyName: '`CSS` property name: {PH1}',
    /**
     *@description Text that is announced by the screen reader when the user focuses on an input field for entering the value of a CSS property in the Styles panel
     *@example {10px} PH1
     */
    cssPropertyValue: '`CSS` property value: {PH1}',
};
const str_ = i18n.i18n.registerUIStrings('panels/elements/PropertyRenderer.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
function mergeWithSpacing(nodes, merge) {
    const result = [...nodes];
    if (SDK.CSSPropertyParser.requiresSpace(nodes, merge)) {
        result.push(document.createTextNode(' '));
    }
    result.push(...merge);
    return result;
}
// A mixin to automatically expose the match type on specific renrerers
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function rendererBase(matchT) {
    class RendererBase {
        matchType = matchT;
        render(_match, _context) {
            return [];
        }
    }
    return RendererBase;
}
// This class is used to guide value tracing when passed to the Renderer. Tracing has two phases. First, substitutions
// such as var() are applied step by step. In each step, all vars in the value are replaced by their definition until no
// vars remain. In the second phase, we evaluate other functions such as calc() or min() or color-mix(). Which CSS
// function types are actually substituted or evaluated is not relevant here, rather it is decided by an individual
// MatchRenderer.
//
// Callers don't need to keep track of the tracing depth (i.e., the number of substitution/evaluation steps).
// TracingContext is stateful and keeps track of the deps, so callers can progressively produce steps by calling
// TracingContext#nextSubstitution or TracingContext#nextEvaluation. Calling Renderer with the tracing context will then
// produce the next step of tracing. The tracing depth is passed to the individual MatchRenderers by way of
// TracingContext#substitution or TracingContext#applyEvaluation/TracingContext#evaluation (see function-level comments
// about how these two play together), which MatchRenderers call to request a fresh TracingContext for the next level of
// substitution/evaluation.
export class TracingContext {
    #substitutionDepth = 0;
    #hasMoreSubstitutions;
    #parent = null;
    #evaluationCount = 0;
    #appliedEvaluations = 0;
    #hasMoreEvaluations = true;
    constructor(matchedResult) {
        this.#hasMoreSubstitutions =
            matchedResult?.hasMatches(SDK.CSSPropertyParserMatchers.VariableMatch, SDK.CSSPropertyParserMatchers.BaseVariableMatch) ??
                false;
    }
    renderingContext(context) {
        return new RenderingContext(context.ast, context.renderers, context.matchedResult, context.cssControls, context.options, this);
    }
    nextSubstitution() {
        if (!this.#hasMoreSubstitutions) {
            return false;
        }
        this.#substitutionDepth++;
        this.#hasMoreSubstitutions = false;
        return true;
    }
    nextEvaluation() {
        if (this.#hasMoreSubstitutions) {
            throw new Error('Need to apply substitutions first');
        }
        if (!this.#hasMoreEvaluations) {
            return false;
        }
        this.#appliedEvaluations = 0;
        this.#hasMoreEvaluations = false;
        this.#evaluationCount++;
        return true;
    }
    didApplyEvaluations() {
        return this.#appliedEvaluations > 0;
    }
    #setHasMoreEvaluations(value) {
        if (this.#parent) {
            this.#parent.#setHasMoreEvaluations(value);
        }
        this.#hasMoreEvaluations = value;
    }
    // Evaluations are applied bottom up, i.e., innermost sub-expressions are evaluated first before evaluating any
    // function call. This function produces TracingContexts for each of the arguments of the function call which should
    // be passed to the Renderer calls for the respective subtrees.
    evaluation(args) {
        const childContexts = args.map(() => {
            const child = new TracingContext();
            child.#parent = this;
            child.#substitutionDepth = this.#substitutionDepth;
            child.#evaluationCount = this.#evaluationCount;
            child.#hasMoreSubstitutions = this.#hasMoreSubstitutions;
            return child;
        });
        return childContexts;
    }
    #setAppliedEvaluations(value) {
        if (this.#parent) {
            this.#parent.#setAppliedEvaluations(value);
        }
        this.#appliedEvaluations = Math.max(this.#appliedEvaluations, value);
    }
    // After rendering the arguments of a function call, the TracingContext produced by TracingContext#evaluation need
    // to be passed here to determine whether the "current" function call should be evaluated or not.
    applyEvaluation(children) {
        if (this.#evaluationCount === 0 || children.some(child => child.#appliedEvaluations >= this.#evaluationCount)) {
            this.#setHasMoreEvaluations(true);
            return false;
        }
        this.#setAppliedEvaluations(children.map(child => child.#appliedEvaluations).reduce((a, b) => Math.max(a, b), 0) + 1);
        return true;
    }
    #setHasMoreSubstitutions() {
        if (this.#parent) {
            this.#parent.#setHasMoreSubstitutions();
        }
        this.#hasMoreSubstitutions = true;
    }
    // Request a tracing context for the next level of substitutions. If this returns null, no further substitution should
    // be applied on this branch of the AST. Otherwise, the TracingContext should be passed to the Renderer call for the
    // substitution subtree.
    substitution() {
        if (this.#substitutionDepth <= 0) {
            this.#setHasMoreSubstitutions();
            return null;
        }
        const child = new TracingContext();
        child.#parent = this;
        child.#substitutionDepth = this.#substitutionDepth - 1;
        child.#evaluationCount = this.#evaluationCount;
        child.#hasMoreSubstitutions = false;
        return child;
    }
}
export class RenderingContext {
    ast;
    renderers;
    matchedResult;
    cssControls;
    options;
    tracing;
    constructor(ast, renderers, matchedResult, cssControls, options = {}, tracing) {
        this.ast = ast;
        this.renderers = renderers;
        this.matchedResult = matchedResult;
        this.cssControls = cssControls;
        this.options = options;
        this.tracing = tracing;
    }
    addControl(cssType, control) {
        if (this.cssControls) {
            const controls = this.cssControls.get(cssType);
            if (!controls) {
                this.cssControls.set(cssType, [control]);
            }
            else {
                controls.push(control);
            }
        }
    }
}
export class Renderer extends SDK.CSSPropertyParser.TreeWalker {
    #matchedResult;
    #output = [];
    #context;
    constructor(ast, renderers, matchedResult, cssControls, options, tracing) {
        super(ast);
        this.#matchedResult = matchedResult;
        this.#context = new RenderingContext(this.ast, renderers, this.#matchedResult, cssControls, options, tracing);
    }
    static render(nodeOrNodes, context) {
        if (!Array.isArray(nodeOrNodes)) {
            return this.render([nodeOrNodes], context);
        }
        const cssControls = new SDK.CSSPropertyParser.CSSControlMap();
        const renderers = nodeOrNodes.map(node => this.walkExcludingSuccessors(context.ast.subtree(node), context.renderers, context.matchedResult, cssControls, context.options, context.tracing));
        const nodes = renderers.map(node => node.#output).reduce(mergeWithSpacing);
        return { nodes, cssControls };
    }
    static renderInto(nodeOrNodes, context, parent) {
        const { nodes, cssControls } = this.render(nodeOrNodes, context);
        if (parent.lastChild && SDK.CSSPropertyParser.requiresSpace([parent.lastChild], nodes)) {
            parent.appendChild(document.createTextNode(' '));
        }
        nodes.map(n => parent.appendChild(n));
        return { nodes, cssControls };
    }
    renderedMatchForTest(_nodes, _match) {
    }
    enter({ node }) {
        const match = this.#matchedResult.getMatch(node);
        const renderer = match &&
            this.#context.renderers.get(match.constructor);
        if (renderer || match instanceof SDK.CSSPropertyParserMatchers.TextMatch) {
            const output = renderer ? renderer.render(match, this.#context) :
                match.render();
            this.renderedMatchForTest(output, match);
            this.#output = mergeWithSpacing(this.#output, output);
            return false;
        }
        return true;
    }
    static renderNameElement(name) {
        const nameElement = document.createElement('span');
        nameElement.setAttribute('jslog', `${VisualLogging.key().track({
            change: true,
            keydown: 'ArrowLeft|ArrowUp|PageUp|Home|PageDown|ArrowRight|ArrowDown|End|Space|Tab|Enter|Escape',
        })}`);
        UI.ARIAUtils.setLabel(nameElement, i18nString(UIStrings.cssPropertyName, { PH1: name }));
        nameElement.className = 'webkit-css-property';
        nameElement.textContent = name;
        nameElement.normalize();
        return nameElement;
    }
    // This function renders a property value as HTML, customizing the presentation with a set of given AST matchers. This
    // comprises the following steps:
    // 1. Build an AST of the property.
    // 2. Apply tree matchers during bottom up traversal.
    // 3. Render the value from left to right into HTML, deferring rendering of matched subtrees to the matchers
    //
    // More general, longer matches take precedence over shorter, more specific matches. Whitespaces are normalized, for
    // unmatched text and around rendered matching results.
    static renderValueElement(name, value, matchedResult, renderers, tracing) {
        const valueElement = document.createElement('span');
        valueElement.setAttribute('jslog', `${VisualLogging.value().track({
            change: true,
            keydown: 'ArrowLeft|ArrowUp|PageUp|Home|PageDown|ArrowRight|ArrowDown|End|Space|Tab|Enter|Escape',
        })}`);
        UI.ARIAUtils.setLabel(valueElement, i18nString(UIStrings.cssPropertyValue, { PH1: value }));
        valueElement.className = 'value';
        if (!matchedResult) {
            valueElement.appendChild(document.createTextNode(value));
            return { valueElement, cssControls: new Map() };
        }
        const rendererMap = new Map();
        for (const renderer of renderers) {
            rendererMap.set(renderer.matchType, renderer);
        }
        const context = new RenderingContext(matchedResult.ast, rendererMap, matchedResult, undefined, {}, tracing);
        const { nodes, cssControls } = Renderer.render([matchedResult.ast.tree, ...matchedResult.ast.trailingNodes], context);
        nodes.forEach(node => valueElement.appendChild(node));
        valueElement.normalize();
        return { valueElement, cssControls };
    }
}
// clang-format off
export class URLRenderer extends rendererBase(SDK.CSSPropertyParserMatchers.URLMatch) {
    rule;
    node;
    // clang-format on
    constructor(rule, node) {
        super();
        this.rule = rule;
        this.node = node;
    }
    render(match) {
        const url = unescapeCssString(match.url);
        const container = document.createDocumentFragment();
        UI.UIUtils.createTextChild(container, 'url(');
        let hrefUrl = null;
        if (this.rule && this.rule.resourceURL()) {
            hrefUrl = Common.ParsedURL.ParsedURL.completeURL(this.rule.resourceURL(), url);
        }
        else if (this.node) {
            hrefUrl = this.node.resolveURL(url);
        }
        const link = ImagePreviewPopover.setImageUrl(Components.Linkifier.Linkifier.linkifyURL(hrefUrl || url, {
            text: url,
            preventClick: false,
            // crbug.com/1027168
            // We rely on CSS text-overflow: ellipsis to hide long URLs in the Style panel,
            // so that we don't have to keep two versions (original vs. trimmed) of URL
            // at the same time, which complicates both StylesSidebarPane and StylePropertyTreeElement.
            bypassURLTrimming: true,
            showColumnNumber: false,
            inlineFrameIndex: 0,
        }), hrefUrl || url);
        container.appendChild(link);
        UI.UIUtils.createTextChild(container, ')');
        return [container];
    }
}
// clang-format off
export class StringRenderer extends rendererBase(SDK.CSSPropertyParserMatchers.StringMatch) {
    // clang-format on
    render(match) {
        const element = document.createElement('span');
        element.innerText = match.text;
        UI.Tooltip.Tooltip.install(element, unescapeCssString(match.text));
        return [element];
    }
}
// clang-format off
export class BinOpRenderer extends rendererBase(SDK.CSSPropertyParserMatchers.BinOpMatch) {
    // clang-format on
    render(match, context) {
        const [lhs, binop, rhs] = SDK.CSSPropertyParser.ASTUtils.children(match.node).map(child => Renderer.render(child, context).nodes);
        return [lhs, document.createTextNode(' '), binop, document.createTextNode(' '), rhs].flat();
    }
}
//# sourceMappingURL=PropertyRenderer.js.map