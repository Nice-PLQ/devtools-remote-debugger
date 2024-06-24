import Dom from './dom';
import DomStorage from './dom-storage';
import Storage from './storage';
import Overlay from './overlay';
import Runtime from './runtime';
import Page from './page';
import Network from './network';
import Css from './css';
import SourceDebugger from './debugger';
import ScreenPreview from './screen-preview';
import protocol from './protocol';

export default class ChromeDomain {
  protocol = {};

  constructor(options) {
    this.registerProtocol(options);
    this.proxyAppendChild();
  }

  /**
   * Execution CDP method
   * @public
   * @param {Object} message socket data
   */
  execute(message = {}) {
    const { id, method, params } = message;
    const methodCall = this.protocol[method];
    if (typeof methodCall !== 'function') return { id };

    return { id, result: methodCall(params) };
  }

  /**
   * @private
   */
  registerProtocol(options) {
    const domains = [
      new Dom(options),
      new DomStorage(options),
      new Storage(options),
      new Overlay(options),
      new Runtime(options),
      new Page(options),
      new Network(options),
      new Css(options),
      new SourceDebugger(options),
      new ScreenPreview(options),
    ];

    domains.forEach((domain) => {
      const { namespace } = domain;
      const cmds = protocol[namespace];
      cmds.forEach((cmd) => {
        this.protocol[`${namespace}.${cmd}`] = domain[cmd].bind(domain);
      });
    });
  }

  proxyAppendChild() {
    const originHeadAppendChild = HTMLHeadElement.prototype.appendChild;
    const originBodyAppendChild = HTMLBodyElement.prototype.appendChild;

    const fetchSource = (node) => {
      const tag = node?.tagName?.toLowerCase();
      if (tag === 'link') {
        const url = node.getAttribute('href');
        const rel = node.getAttribute('rel');
        if (url && (!rel || rel === 'stylesheet')) {
          this.protocol['CSS.getDynamicLink'](url);
        }
      }

      if (tag === 'script') {
        const url = node.getAttribute('src');
        if (url) {
          this.protocol['Debugger.getDynamicScript'](url);
        }
      }
    };

    HTMLHeadElement.prototype.appendChild = function (node) {
      const result = originHeadAppendChild.call(this, node);
      fetchSource(node);
      return result;
    };
    HTMLBodyElement.prototype.appendChild = function (node) {
      const result = originBodyAppendChild.call(this, node);
      fetchSource(node);
      return result;
    };
  }
};
