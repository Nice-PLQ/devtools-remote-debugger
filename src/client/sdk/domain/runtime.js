import { objectFormat, objectRelease, getObjectProperties } from '../common/remoteObject';
import BaseDomain from './domain';
import { Event } from './protocol';

const callsite = require('callsite');

export default class Runtime extends BaseDomain {
  namespace = 'Runtime';

  cacheConsole = [];

  cacheError = [];

  isEnable = false;

  socketSend = (type, data) => {
    if (type === 'console') {
      this.cacheConsole.push(data);
    } else if (type === 'error') {
      this.cacheError.push(data);
    }
    if (this.isEnable) {
      this.send(data);
    }
  };

  /**
   * set Chrome Command Line Api
   *
   * In older versions of Electron,
   * you might see the printout of the following function as:
   * ```js
   * // console.log($x):
   * $x(xpath, [startNode]) { [Command Line API] }
   * ```
   * @static
   */
  static setCommandLineApi() {
    window.$_ = undefined;

    if (typeof window.clear !== 'function') {
      window.clear = () => console.clear();
    }

    if (typeof window.copy !== 'function') {
      window.copy = object => {
        function fallbackCopyTextToClipboard(text) {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.top = 0;
          textArea.style.left = 0;
          textArea.style.width = '1px';
          textArea.style.height = '1px';
          textArea.style.padding = 0;
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            const successful = document.execCommand('copy');
            if (!successful) console.error('Unable to copy using execCommand');
          } catch (err) {
            console.error('Unable to copy using execCommand:', err);
          }
          document.body.removeChild(textArea);
        }
        if ('clipboard' in navigator) {
          navigator.clipboard.writeText(String(object)).catch(() => {
            fallbackCopyTextToClipboard(String(object));
          });
        } else {
          fallbackCopyTextToClipboard(String(object));
        }
      };
    }

    if (typeof window.dir !== 'function') {
      window.dir = object => console.dir(object);
    }

    if (typeof window.dirxml !== 'function') {
      window.dirxml = object => console.dirxml(object);
    }

    if (typeof window.keys !== 'function') {
      window.keys = object => Object.keys(object);
    }

    if (typeof window.values !== 'function') {
      window.values = object => Object.values(object);
    }

    if (typeof window.table !== 'function') {
      window.table = object => console.table(object);
    }
  }

  constructor(options) {
    super(options);
    this.hookConsole();
    this.listenError();
  }

  /**
   * Get call stack
   * @static
   * @param {Error} error
   */
  static getCallFrames(error) {
    let callFrames = [];
    let stack;
    if (error) {
      stack = error.stack;
      callFrames = stack.split('\n').map(val => ({
        functionName: val,
        ...Runtime.getPositionAndUrl(val)
      }));
      // Safari does not support captureStackTrace
    } else if (Error.captureStackTrace) {
      callFrames = callsite().map(val => ({
        functionName: val.getFunctionName(),
        lineNumber: val.getLineNumber(),
        columnNumber: val.getColumnNumber(),
        url: val.getFileName(),
      }));
    } else {
      stack = new Error().stack;
      callFrames = stack.split('\n').map(val => ({
        functionName: val,
        ...Runtime.getPositionAndUrl(val)
      }));
    }

    callFrames.shift();
    return callFrames;
  }

  /**
   * Get the line number and column number of each stack code from the error stack
   * @static
   */
  static getPositionAndUrl(str) {
    const reg = /at\s+(.*)(?::([0-9]+):([0-9]+))$/; // for android
    const reg1 = /@+(.*)(?::([0-9]+):([0-9]+))$/; // for ios

    let res;
    if (reg.test(str)) {
      res = reg.exec(str);
    } else if (reg1.test(str)) {
      res = reg1.exec(str);
    }

    if (res) {
      return {
        url: res[1],
        lineNumber: res[2],
        columnNumber: res[3]
      };
    }

    return {};
  }

  /**
   * @public
   */
  enable() {
    this.isEnable = true;
    this.cacheConsole.forEach(data => this.send(data));
    this.cacheError.forEach(data => this.send(data));

    this.send({
      method: Event.executionContextCreated,
      params: {
        context: {
          id: 1,
          name: 'top',
          origin: location.origin,
        }
      }
    });
    Runtime.setCommandLineApi();
  }

  /**
   * script execution
   * @public
   * @param {Object} param
   * @param {String} param.expression expression string
   * @param {Boolean} param.generatePreview whether to generate a preview
   */
  evaluate({ expression, generatePreview }) {
    // Modifying the scope to the global scope enables variables defined
    // with var to be accessible globally.
    // eslint-disable-next-line
    const res = window.eval(expression);
    // chrome-api
    window.$_ = res;
    return {
      result: objectFormat(res, { preview: generatePreview }),
    };
  }

  /**
   * Get object properties
   * @public
   */
  getProperties(params) {
    return {
      result: getObjectProperties(params),
    };
  }

  /**
   * release object
   * @public
   */
  releaseObject(params) {
    objectRelease(params);
  }

  /**
   * Intercept method of console object
   * @private
   */
  hookConsole() {
    const methods = {
      log: 'log',
      debug: 'debug',
      info: 'info',
      error: 'error',
      warn: 'warning',
      dir: 'dir',
      dirxml: 'dirxml',
      table: 'table',
      trace: 'trace',
      clear: 'clear',
      group: 'startGroup',
      groupCollapsed: 'startGroupCollapsed',
      groupEnd: 'endGroup',
      // assert: 'assert',
      // profile: 'profile',
      // profileEnd: 'profileEnd',
      // count: 'count',
      // timeEnd: 'timeEnd',
    };

    Object.keys(methods).forEach((key) => {
      const nativeConsoleFunc = window.console[key];
      window.console[key] = (...args) => {
        nativeConsoleFunc?.(...args);
        const data = {
          method: Event.consoleAPICalled,
          params: {
            type: methods[key],
            args: args.map(arg => objectFormat(arg, { preview: true })),
            executionContextId: 1,
            timestamp: Date.now(),
            stackTrace: {
              // processing call stack
              callFrames: ['error', 'warn', 'trace', 'assert'].includes(key) ? Runtime.getCallFrames() : [],
            }
          }
        };
        this.socketSend('console', data);
      };
    });
  }

  /**
   * Global error monitor
   * @private
   */
  listenError() {
    const exceptionThrown = (error) => {
      const data = {
        method: Event.exceptionThrown,
        params: {
          timestamp: Date.now(),
          exceptionDetails: {
            text: 'Uncaught',
            exception: {
              type: 'object',
              subtype: 'error',
              className: error ? error.name : 'Error',
              description: error ? error.stack : 'Script error.',
            },
            stackTrace: {
              callFrames: Runtime.getCallFrames(error)
            },
          }
        }
      };
      this.socketSend('error', data);
    };

    window.addEventListener('error', e => exceptionThrown(e.error));
    window.addEventListener('unhandledrejection', e => exceptionThrown(e.reason));
  }
};
