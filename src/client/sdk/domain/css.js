import nodes from '../common/nodes';
import { getAbsoultPath, isMatches } from '../common/utils';
import BaseDomain from './domain';
import { Event } from './protocol';

export default class CSS extends BaseDomain {
  namespace = 'CSS';

  // css style collection
  styles = new Map();

  // The unique id of the css style sheet
  styleSheetId = 0;

  /**
   * Formatting css rules
   * @static
   * @param {string} rule css selector rules
   * @param {Node} node DOM node
   */
  static formatCssRule(rule, node) {
    let index = 0;
    const selectors = rule.selectorText.split(',').map((item, i) => {
      const text = item.trim();
      if (isMatches(node, text)) {
        index = i;
      }
      return { text };
    });

    const cssText = /\{(.*)\}/.exec(rule.cssText)[1];

    return {
      index,
      cssRule: {
        style: {
          cssText,
          cssProperties: CSS.formatCssProperties(cssText),
          shorthandEntries: []
        },
        selectorList: {
          selectors,
          text: rule.selectorText,
        },
      }
    };
  }

  /**
   * Formatting css properties
   * @static
   * @param {String} cssText css text，eg：height:100px;width:100px !important;
   */
  static formatCssProperties(cssText = '') {
    return cssText.split(';').filter(val => val.trim())
      .map((style) => {
        const [name, value] = style.split(':');
        return {
          name: name.trim(),
          value: value.trim(),
          text: style,
          important: value.includes('important'),
          disabled: false,
          shorthandEntries: [],
        };
      });
  }

  /**
   * Enable CSS Domains
   * @public
   */
  enable() {
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((style) => {
      if (!style.styleSheetId) {
        const styleSheetId = this.getStyleSheetId();
        style.styleSheetId = styleSheetId;

        const sourceURL = getAbsoultPath(style.href);
        if (sourceURL) {
          this.fetchStyleSource(styleSheetId, sourceURL);
        }

        this.send({
          method: Event.styleSheetAdded,
          params: {
            header: {
              styleSheetId,
              sourceURL,
            }
          }
        });
      }
    });
  }

  /**
   * Get the matching style of the DOM node
   * @public
   * @param {Object} param
   * @param {Number} param.nodeId DOM node id
   */
  getMatchedStylesForNode({ nodeId }) {
    const matchedCSSRules = [];
    const node = nodes.getNodeById(nodeId);
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach((style) => {
      try {
        // Chrome does not allow access to css rules under different domain names, here are the errors captured
        // https://stackoverflow.com/questions/49993633/uncaught-domexception-failed-to-read-the-cssrules-property
        Array.from(style.cssRules).forEach((rule) => {
          if (isMatches(node, rule.selectorText)) {
            const { index, cssRule } = CSS.formatCssRule(rule, node);
            matchedCSSRules.push({
              matchingSelectors: [index],
              rule: cssRule,
            });
          }
        });
      } catch {
        // nothing to do.
      }
    });

    const { cssText } = node.style || {};
    return {
      matchedCSSRules,
      inlineStyle: {
        cssText,
        cssProperties: CSS.formatCssProperties(cssText),
        shorthandEntries: [],
      }
    };
  }

  /**
   * Get the computed style of a DOM node
   * @public
   * @param {Object} param
   * @param {Number} param.nodeId DOM node id
   */
  getComputedStyleForNode({ nodeId }) {
    const node = nodes.getNodeById(nodeId);
    if (!(node instanceof Element)) return;
    let computedStyle = window.getComputedStyle(node);
    computedStyle = Array.from(computedStyle).map(style => ({
      name: style,
      value: computedStyle[style]
    }));
    return { computedStyle };
  }

  /**
   * get style content
   * @public
   * @param {Object} param
   * @param {Number} param.styleSheetId style id
   */
  getStyleSheetText({ styleSheetId }) {
    return {
      text: this.styles.get(styleSheetId),
    };
  }

  /**
   * fetch the source content of the css file
   * @private
   * @param {number} styleSheetId style file id
   * @param {string} url style file url address
   */
  fetchStyleSource(styleSheetId, url) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      this.styles.set(styleSheetId, xhr.responseText);
    };
    xhr.onerror = () => {
      this.styles.set(styleSheetId, 'Cannot get style source code');
    };

    xhr.open('GET', url);
    xhr.send();
  }

  /**
   * Get the unique id of the style
   * @private
   */
  getStyleSheetId() {
    this.styleSheetId += 1;
    return `${this.styleSheetId}`;
  }
}
