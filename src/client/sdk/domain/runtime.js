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
  }

  /**
   * script execution
   * @public
   * @param {Object} param
   * @param {String} param.expression expression string
   * @param {Boolean} param.generatePreview whether to generate a preview
   */
  evaluate({ expression, generatePreview }) {
    // eslint-disable-next-line
    const res = eval(expression);
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
      warn: 'warning',
      info: 'info',
      error: 'error',
    };

    Object.keys(methods).forEach((key) => {
      const nativeConsoleFunc = window.console[key];
      window.console[key] = (...args) => {
        nativeConsoleFunc(...args);
        const data = {
          method: Event.consoleAPICalled,
          params: {
            type: methods[key],
            args: args.map(arg => objectFormat(arg, { preview: true })),
            executionContextId: 1,
            timestamp: Date.now(),
            stackTrace: {
              // error, warn processing call stack
              callFrames: ['error', 'warn'].includes(key) ? Runtime.getCallFrames() : [],
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
