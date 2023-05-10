import BaseDomain from './domain';
import { getAbsoultPath } from '../common/utils';
import { Event } from './protocol';

export default class Debugger extends BaseDomain {
  namespace = 'Debugger';

  // collection of javascript scripts
  scripts = new Map();

  // Unique id for javascript scripts
  scriptId = 0;

  /**
   * @public
   */
  enable() {
    const scripts = this.collectScripts();
    scripts.forEach(({ scriptId, url }) => {
      this.send({
        method: Event.scriptParsed,
        params: {
          scriptId,
          startColumn: 0,
          startLine: 0,
          endColumn: 999999,
          endLine: 999999,
          scriptLanguage: 'JavaScript',
          url,
        }
      });
    });
  }

  /**
   * Get the content of the js script file
   * @public
   * @param {Object} param
   * @param {Number} param.scriptId
   */
  getScriptSource({ scriptId }) {
    return {
      scriptSource: this.getScriptSourceById(scriptId)
    };
  }

  /**
   * Collect all scripts of the page
   * @private
   */
  collectScripts() {
    const scriptElements = document.querySelectorAll('script');
    const ret = [];
    scriptElements.forEach((script) => {
      const scriptId = this.getScriptId();
      const src = script.getAttribute('src');
      if (src) {
        const url = getAbsoultPath(src);
        ret.push({ scriptId, url });
        this.fetchScriptSource(scriptId, url);
      }
    });
    return ret;
  }

  /**
   * Fetch javascript file source content
   * @private
   * @param {Number} scriptId javascript script unique id
   * @param {String} url javascript file url
   */
  fetchScriptSource(scriptId, url) {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      this.scripts.set(scriptId, xhr.responseText);
    };
    xhr.onerror = () => {
      this.scripts.set(scriptId, 'Cannot get script source code');
    };

    xhr.open('GET', url);
    xhr.send();
  }

  /**
   * Get javascript content
   * @private
   * @param {Object} param
   * @param {Number} param.scriptId javascript script unique id
   */
  getScriptSourceById(scriptId) {
    return this.scripts.get(scriptId);
  }

  /**
   * Get unique id of javascript script
   * @private
   */
  getScriptId() {
    this.scriptId += 1;
    return `${this.scriptId}`;
  }
};
