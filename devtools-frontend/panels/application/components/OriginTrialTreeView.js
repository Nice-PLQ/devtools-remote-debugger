// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../ui/components/icon_button/icon_button.js';
import '../../../ui/components/tree_outline/tree_outline.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Adorners from '../../../ui/components/adorners/adorners.js';
import * as Lit from '../../../ui/lit/lit.js';
import badgeStylesRaw from './badge.css.js';
import originTrialTokenRowsStylesRaw from './originTrialTokenRows.css.js';
import originTrialTreeViewStylesRaw from './originTrialTreeView.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const badgeStyles = new CSSStyleSheet();
badgeStyles.replaceSync(badgeStylesRaw.cssContent);
const originTrialTokenRowsStyles = new CSSStyleSheet();
originTrialTokenRowsStyles.replaceSync(originTrialTokenRowsStylesRaw.cssContent);
const originTrialTreeViewStyles = new CSSStyleSheet();
originTrialTreeViewStyles.replaceSync(originTrialTreeViewStylesRaw.cssContent);
const { html, Directives: { ifDefined } } = Lit;
const UIStrings = {
    /**
     *@description Label for the 'origin' field in a parsed Origin Trial Token.
     */
    origin: 'Origin',
    /**
     *@description Label for `trialName` field in a parsed Origin Trial Token.
     * This field is only shown when token has unknown trial name as the token
     * will be put into 'UNKNOWN' group.
     */
    trialName: 'Trial Name',
    /**
     *@description Label for `expiryTime` field in a parsed Origin Trial Token.
     */
    expiryTime: 'Expiry Time',
    /**
     *@description Label for `usageRestriction` field in a parsed Origin Trial Token.
     */
    usageRestriction: 'Usage Restriction',
    /**
     *@description Label for `isThirdParty` field in a parsed Origin Trial Token.
     */
    isThirdParty: 'Third Party',
    /**
     *@description Label for a field containing info about an Origin Trial Token's `matchSubDomains` field.
     *An Origin Trial Token contains an origin URL. The `matchSubDomains` field describes whether the token
     *only applies to the origin URL or to all subdomains of the origin URL as well.
     *The field contains either 'true' or 'false'.
     */
    matchSubDomains: 'Subdomain Matching',
    /**
     *@description Label for the raw(= encoded / not human-readable) Origin Trial Token.
     */
    rawTokenText: 'Raw Token',
    /**
     *@description Label for `status` field in an Origin Trial Token.
     */
    status: 'Token Status',
    /**
     *@description Label for tokenWithStatus node.
     */
    token: 'Token',
    /**
     *@description Label for a badge showing the number of Origin Trial Tokens. This number is always greater than 1.
     *@example {2} PH1
     */
    tokens: '{PH1} tokens',
    /**
     *@description Label shown when there are no Origin Trial Tokens in the Frame view of the Application panel.
     */
    noTrialTokens: 'No trial tokens',
};
const str_ = i18n.i18n.registerUIStrings('panels/application/components/OriginTrialTreeView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class Badge extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #adorner = new Adorners.Adorner.Adorner();
    set data(data) {
        this.#render(data);
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [badgeStyles];
    }
    #render(data) {
        const adornerContent = document.createElement('span');
        adornerContent.textContent = data.badgeContent;
        this.#adorner.data = {
            name: 'badge',
            content: adornerContent,
        };
        this.#adorner.classList.add(`badge-${data.style}`);
        Lit.render(html `
      ${this.#adorner}
    `, this.#shadow, { host: this });
    }
}
customElements.define('devtools-resources-origin-trial-tree-view-badge', Badge);
function constructOriginTrialTree(originTrial) {
    return {
        treeNodeData: originTrial,
        id: 'OriginTrialTreeNode#' + originTrial.trialName,
        children: async () => originTrial.tokensWithStatus.length > 1 ?
            originTrial.tokensWithStatus.map(constructTokenNode) :
            constructTokenDetailsNodes(originTrial.tokensWithStatus[0]),
        renderer: (node) => {
            const trial = node.treeNodeData;
            const tokenCountBadge = html `
        <devtools-resources-origin-trial-tree-view-badge .data=${{
                badgeContent: i18nString(UIStrings.tokens, { PH1: trial.tokensWithStatus.length }),
                style: 'secondary',
            }}></devtools-resources-origin-trial-tree-view-badge>
      `;
            return html `
        ${trial.trialName}
        <devtools-resources-origin-trial-tree-view-badge .data=${{
                badgeContent: trial.status,
                style: trial.status === "Enabled" /* Protocol.Page.OriginTrialStatus.Enabled */ ? 'success' : 'error',
            }}></devtools-resources-origin-trial-tree-view-badge>
        ${trial.tokensWithStatus.length > 1 ? tokenCountBadge : Lit.nothing}
      `;
        },
    };
}
function constructTokenNode(token) {
    return {
        treeNodeData: token.status,
        id: 'TokenNode#' + token.rawTokenText,
        children: async () => constructTokenDetailsNodes(token),
        renderer: (node, state) => {
            const tokenStatus = node.treeNodeData;
            const statusBadge = html `
        <devtools-resources-origin-trial-tree-view-badge .data=${{
                badgeContent: tokenStatus,
                style: tokenStatus === "Success" /* Protocol.Page.OriginTrialTokenStatus.Success */ ? 'success' : 'error',
            }}></devtools-resources-origin-trial-tree-view-badge>
      `;
            // Only display token status for convenience when the node is not expanded.
            return html `${i18nString(UIStrings.token)} ${state.isExpanded ? Lit.nothing : statusBadge}`;
        },
    };
}
function renderTokenDetails(node) {
    return html `
    <devtools-resources-origin-trial-token-rows .data=${{ node }}>
    </devtools-resources-origin-trial-token-rows>
    `;
}
function constructTokenDetailsNodes(token) {
    return [
        {
            treeNodeData: token,
            id: 'TokenDetailsNode#' + token.rawTokenText,
            renderer: renderTokenDetails,
        },
        constructRawTokenTextNode(token.rawTokenText),
    ];
}
function constructRawTokenTextNode(tokenText) {
    return {
        treeNodeData: i18nString(UIStrings.rawTokenText),
        id: 'TokenRawTextContainerNode#' + tokenText,
        children: async () => [{
                treeNodeData: tokenText,
                id: 'TokenRawTextNode#' + tokenText,
                renderer: (data) => {
                    const tokenText = data.treeNodeData;
                    return html `
        <div style="overflow-wrap: break-word;">
          ${tokenText}
        </div>
        `;
                },
            }],
    };
}
function defaultRenderer(node) {
    return html `${String(node.treeNodeData)}`;
}
export class OriginTrialTokenRows extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #tokenWithStatus = null;
    #parsedTokenDetails = [];
    #dateFormatter = new Intl.DateTimeFormat(i18n.DevToolsLocale.DevToolsLocale.instance().locale, { dateStyle: 'long', timeStyle: 'long' });
    set data(data) {
        this.#tokenWithStatus = data.node.treeNodeData;
        this.#setTokenFields();
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [originTrialTokenRowsStyles];
        this.#render();
    }
    #renderTokenField = (fieldValue, hasError) => html `
        <div class=${ifDefined(hasError ? 'error-text' : undefined)}>
          ${fieldValue}
        </div>`;
    #setTokenFields() {
        if (!this.#tokenWithStatus?.parsedToken) {
            return;
        }
        this.#parsedTokenDetails = [
            {
                name: i18nString(UIStrings.origin),
                value: this.#renderTokenField(this.#tokenWithStatus.parsedToken.origin, this.#tokenWithStatus.status === "WrongOrigin" /* Protocol.Page.OriginTrialTokenStatus.WrongOrigin */),
            },
            {
                name: i18nString(UIStrings.expiryTime),
                value: this.#renderTokenField(this.#dateFormatter.format(this.#tokenWithStatus.parsedToken.expiryTime * 1000), this.#tokenWithStatus.status === "Expired" /* Protocol.Page.OriginTrialTokenStatus.Expired */),
            },
            {
                name: i18nString(UIStrings.usageRestriction),
                value: this.#renderTokenField(this.#tokenWithStatus.parsedToken.usageRestriction),
            },
            {
                name: i18nString(UIStrings.isThirdParty),
                value: this.#renderTokenField(this.#tokenWithStatus.parsedToken.isThirdParty.toString()),
            },
            {
                name: i18nString(UIStrings.matchSubDomains),
                value: this.#renderTokenField(this.#tokenWithStatus.parsedToken.matchSubDomains.toString()),
            },
        ];
        if (this.#tokenWithStatus.status === "UnknownTrial" /* Protocol.Page.OriginTrialTokenStatus.UnknownTrial */) {
            this.#parsedTokenDetails = [
                {
                    name: i18nString(UIStrings.trialName),
                    value: this.#renderTokenField(this.#tokenWithStatus.parsedToken.trialName),
                },
                ...this.#parsedTokenDetails,
            ];
        }
    }
    #render() {
        if (!this.#tokenWithStatus) {
            return;
        }
        const tokenDetails = [
            {
                name: i18nString(UIStrings.status),
                value: html `
          <devtools-resources-origin-trial-tree-view-badge .data=${{
                    badgeContent: this.#tokenWithStatus.status,
                    style: this.#tokenWithStatus.status === "Success" /* Protocol.Page.OriginTrialTokenStatus.Success */ ? 'success' : 'error',
                }}></devtools-resources-origin-trial-tree-view-badge>`,
            },
            ...this.#parsedTokenDetails,
        ];
        const tokenDetailRows = tokenDetails.map((field) => {
            return html `
          <div class="key">${field.name}</div>
          <div class="value">${field.value}</div>
          `;
        });
        Lit.render(html `
      <div class="content">
        ${tokenDetailRows}
      </div>
    `, this.#shadow, { host: this });
    }
}
customElements.define('devtools-resources-origin-trial-token-rows', OriginTrialTokenRows);
export class OriginTrialTreeView extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    set data(data) {
        this.#render(data.trials);
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [originTrialTreeViewStyles];
    }
    #render(trials) {
        if (!trials.length) {
            Lit.render(html `
    <span class="status-badge">
      <devtools-icon
          .data=${{
                iconName: 'clear',
                color: 'var(--icon-default)',
                width: '16px',
                height: '16px',
            }}
        >
      </devtools-icon>
      <span>${i18nString(UIStrings.noTrialTokens)}</span>
    </span>`, this.#shadow, { host: this });
            return;
        }
        Lit.render(html `
      <devtools-tree-outline .data=${{
            tree: trials.map(constructOriginTrialTree),
            defaultRenderer,
        }}>
      </devtools-tree-outline>
    `, this.#shadow, { host: this });
    }
}
customElements.define('devtools-resources-origin-trial-tree-view', OriginTrialTreeView);
//# sourceMappingURL=OriginTrialTreeView.js.map