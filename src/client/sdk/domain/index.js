import Dom from './dom';
import DomStorage from './dom-storage';
import Storage from './storage';
import Overlay from './overlay';
import Runtime from './runtime';
import Page from './page';
import Network from './network';
import Css from './css';
import SourceDebugger from './debugger';
import Screenshot from './screenshot';
import protocol from './protocol';

export default class ChromeDomain {
  protocol = {};

  constructor(options) {
    this.registerProtocol(options);
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
      new Screenshot(options),
    ];

    domains.forEach((domain) => {
      const { namespace } = domain;
      const cmds = protocol[namespace];
      cmds.forEach((cmd) => {
        this.protocol[`${namespace}.${cmd}`] = domain[cmd].bind(domain);
      });
    });
  }
};
