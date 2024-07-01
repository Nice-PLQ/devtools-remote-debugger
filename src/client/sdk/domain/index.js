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
    this.proxyEventListener();
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

  /**
   * inject getEventListeners
   */
  proxyEventListener() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

    const eventListenersMap = Dom.eventListenersMap;

    EventTarget.prototype.addEventListener = function(type, listener, optionOrUseCapture) {
      let options;
      if (typeof optionOrUseCapture === 'object' && optionOrUseCapture !== null) {
        options = optionOrUseCapture;
      } else {
        options = { capture: Boolean(optionOrUseCapture) };
      }

      const targetListeners = eventListenersMap.get(this) || {};
      if (!targetListeners[type]) {
        targetListeners[type] = [];
      }
      targetListeners[type].push({ listener, once: options.once || false, passive: options.passive || false, capture: options.capture || false });
      eventListenersMap.set(this, targetListeners);

      return originalAddEventListener.apply(this, [type, listener, options.capture]);
    };

    EventTarget.prototype.removeEventListener = function(type, listener, optionOrUseCapture) {
      let options;
      if (typeof optionOrUseCapture === 'object' && optionOrUseCapture !== null) {
        options = optionOrUseCapture;
      } else {
        options = { capture: Boolean(optionOrUseCapture) };
      }

      const targetListeners = eventListenersMap.get(this) || {};
      if (targetListeners[type]) {
        const index = targetListeners[type].findIndex(item =>
          item.listener === listener &&
          item.once === (options.once || false) &&
          item.passive === (options.passive || false) &&
          item.capture === (options.capture || false)
        );
        if (index > -1) {
          targetListeners[type].splice(index, 1);
          if (targetListeners[type].length === 0) {
            delete targetListeners[type];
          }
        }
      }
      eventListenersMap.set(this, targetListeners);

      return originalRemoveEventListener.apply(this, [type, listener, options.capture]);
    };

    window.getEventListeners = function(target) {
      return eventListenersMap.get(target) || {};
    };
  }
};
