import BaseDomain from './domain';
import { getObjectById, objectFormat } from '../common/remoteObject';
import nodes from '../common/nodes';

export default class DomDebugger extends BaseDomain {
  namespace = 'DOMDebugger';

  /**
   * @type { WeakMap<EventTarget, { [key: string]: (AddEventListenerOptions & { listener: Function, type: string, scriptId?: string, lineNumber?: number, columnNumber?: number })[] }> }
   * @static
   * @public
   */
  static eventListenersMap = new WeakMap();

  /**
   * @public
   */
  getEventListeners({ objectId }) {
    const node = getObjectById(objectId);
    return {
      listeners: Object.values(DomDebugger.eventListenersMap.get(node) || {}).flat(1).map(v => {
        const copy = { ...v };
        // listener -> handler
        delete copy.listener;
        copy.handler = copy.originalHandler = objectFormat(v.listener);
        // capture -> useCapture
        delete copy.capture;
        copy.backendNodeId = nodes.getIdByNode(node);
        return copy;
      })
    };
  }
}
