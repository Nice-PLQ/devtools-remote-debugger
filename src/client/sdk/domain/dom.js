import nodes from '../common/nodes';
import { getObjectById } from '../common/remoteObject';
import { DEVTOOL_OVERLAY, IGNORE_NODE } from '../common/constant';
import BaseDomain from './domain';
import { Event } from './protocol';
import Overlay from './overlay';

export default class Dom extends BaseDomain {
  namespace = 'DOM';

  searchId = 0;

  searchRet = new Map();

  currentSearchKey = '';

  /**
   * @type { WeakMap<EventTarget, { [key: string]: EventListenerOptions & { listener: Function, type: string } }> }
   * @static
   * @public
   */
  static eventListenersMap = new WeakMap();

  /**
   * set $, $$ and $x methods
   * @static
   */
  static set$Function() {
    if (typeof window.$ !== 'function') {
      window.$ = function (selector) {
        return document.querySelector(selector);
      };
    }

    if (typeof window.$$ !== 'function') {
      window.$$ = function (selector) {
        return document.querySelectorAll(selector);
      };
    }

    if (typeof window.$x !== 'function') {
      window.$x = function (selector) {
        const xpathResult = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const elements = [];

        for (let i = 0; i < xpathResult.snapshotLength; i++) {
          elements.push(xpathResult.snapshotItem(i));
        }

        return elements;
      };
    }
  }

  /**
   * Enable Dom domain
   * @public
   */
  enable() {
    nodes.init();
    this.nodeObserver();
    this.setDomInspect();
    Dom.set$Function();
  }

  /**
   * Get root's documentation
   * @public
   */
  getDocument() {
    return {
      root: nodes.collectNodes(document),
    };
  }

  /**
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   */
  requestChildNodes({ nodeId }) {
    if (nodes.hasRequestedChildNode.has(nodeId)) {
      return;
    }
    nodes.hasRequestedChildNode.add(nodeId);
    this.send({
      method: Event.setChildNodes,
      params: {
        parentId: nodeId,
        nodes: nodes.getChildNodes(nodes.getNodeById(nodeId), 2)
      }
    });
  }

  /**
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   */
  getOuterHTML({ nodeId }) {
    return {
      outerHTML: nodes.getNodeById(nodeId).outerHTML
    };
  }

  /**
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   * @param {String} outerHTML
   */
  setOuterHTML({ nodeId, outerHTML }) {
    nodes.getNodeById(nodeId).outerHTML = outerHTML;
  }

  /**
   * Set the text property of the node
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   * @param {String} text attribute text，eg: class="test" style="color:red;" data-index="1"
   */
  setAttributesAsText({ nodeId, text }) {
    const node = nodes.getNodeById(nodeId);
    if (text) {
      text.split(' ').filter(item => item)
        .forEach((item) => {
          const [name, value] = item.split('=');
          node.setAttribute(name, value.replace(/["']/g, ''));
        });
    } else {
      Array.from(node.attributes).forEach(attr => node.removeAttribute(attr.name));
    }
  }

  /**
   * @public
   * @param {Object} param
   * @param {Number} objectId remoteObject id
   */
  requestNode({ objectId }) {
    const node = getObjectById(objectId);
    const nodeId = nodes.getIdByNode(node);
    return { nodeId };
  }

  /**
   * Set the currently selected node
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   */
  setInspectedNode({ nodeId }) {
    window.$0 = nodes.getNodeById(nodeId);
  }

  /**
   * @public
   * @param {Object} param
   * @param {Number} nodeId DOM Node Id
   */
  removeNode({ nodeId }) {
    const node = nodes.getNodeById(nodeId);
    node?.parentNode?.removeChild(node);
  }

  /**
   * @public
   */
  pushNodesByBackendIdsToFrontend({ backendNodeIds }) {
    return {
      nodeIds: backendNodeIds
    };
  }

  /**
   * @public
   * @param {Object} param
   * @param {String} query search keyword
   */
  performSearch({ query }) {
    let ret = this.searchRet.get(this.searchId);

    if (this.currentSearchKey !== query) {
      this.currentSearchKey = query;
      const allNodes = document.querySelectorAll('*');
      ret = Array.from(allNodes).filter(node => {
        if (!nodes.isNode(node)) return false;

        // element node
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase().includes(query)) {
          return true;
        }

        // match attributes
        for (let i = 0; i < node.attributes.length; i++) {
          const curr = node.attributes[i];
          if (curr.name.includes(query) || curr.value.includes(query)) {
            return true;
          }
        }

        return false;
      });

      this.searchRet.delete(this.searchId);
      this.searchRet.set(++this.searchId, ret);
    }

    return {
      searchId: this.searchId,
      resultCount: ret.length,
    };
  }

  /**
  * @public
  */
  getSearchResults({ fromIndex, toIndex, searchId }) {
    const ret = this.searchRet.get(searchId).slice(fromIndex, toIndex);
    const nodeIds = [];
    ret.forEach(node => {
      this.expandNode(node);
      nodeIds.push(nodes.getIdByNode(node));
    });

    return { nodeIds };
  }

  /**
   * @public
   */
  discardSearchResults({ searchId }) {
    this.searchRet.delete(searchId);
  }

  /**
   * @public
   */
  getNodeForLocation({ x, y }) {
    const hoverNode = document.elementFromPoint(x, y);
    if (hoverNode) {
      this.expandNode(hoverNode);
      const nodeId = nodes.getIdByNode(hoverNode);
      return {
        frameId: 1,
        backendNodeId: nodeId,
        nodeId,
      };
    }
  }

  /**
   * @public
   */
  setNodeValue({ nodeId, value }) {
    const node = nodes.getNodeById(nodeId);
    node.nodeValue = value;
  }

  /**
   * @public
   */
  getBoxModel({ nodeId }) {
    const node = nodes.getNodeById(nodeId);
    const styles = window.getComputedStyle(node);
    const margin = Overlay.getStylePropertyValue(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'], styles);
    const padding = Overlay.getStylePropertyValue(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], styles);
    const border = Overlay.getStylePropertyValue(['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'], styles);

    const { left, right, top, bottom, width, height } = node.getBoundingClientRect();

    return {
      model: {
        width,
        height,
        content: [
          left + border[3] + padding[3], top + border[0] + padding[0],
          right - border[1] - padding[1], top + border[0] + padding[0],
          right - border[1] - padding[1], bottom - border[2] - padding[2],
          left + border[3] + padding[3], bottom - border[2] - padding[2],
        ],
        padding: [
          left + border[3], top + border[0],
          right - border[1], top + border[0],
          right - border[1], bottom - border[2],
          left + border[3], bottom - border[2],
        ],
        border: [
          left, top,
          right, top,
          right, bottom,
          left, bottom,
        ],
        margin: [
          left - margin[3], top - margin[0],
          right + margin[1], top - margin[0],
          right + margin[1], bottom + margin[2],
          left - margin[3], bottom + margin[2],
        ],
      }
    };
  }

  /**
   * @private
   */
  expandNode(node) {
    const nodeIds = [];
    while (!nodes.hasNode(node)) {
      const nodeId = nodes.getIdByNode(node);
      nodeIds.unshift(nodeId);
      node = node.parentNode;
    }

    nodeIds.unshift(nodes.getIdByNode(node));

    nodeIds.forEach((nodeId) => {
      this.requestChildNodes({ nodeId });
    });
  }

  /**
   * @private
   */
  setDomInspect() {
    document.addEventListener('click', (e) => {
      if (window.$$inspectMode !== 'searchForNode') return;

      e.stopPropagation();
      e.preventDefault();

      const previousNode = e.target.parentNode;
      const currentNodeId = nodes.getIdByNode(e.target);

      this.expandNode(previousNode);

      this.send({
        method: Event.nodeHighlightRequested,
        params: {
          nodeId: currentNodeId
        }
      });

      this.send({
        method: Event.inspectNodeRequested,
        params: {
          backendNodeId: currentNodeId
        }
      });

      document.getElementById(DEVTOOL_OVERLAY).style.display = 'none';
    }, true);
  }

  /**
   * @private
   */
  nodeObserver() {
    const isDevtoolMutation = ({ target, addedNodes, removedNodes }) => {
      if (IGNORE_NODE.includes(target.getAttribute?.('class'))) return true;
      if (IGNORE_NODE.includes(addedNodes[0]?.getAttribute?.('class'))) return true;
      if (IGNORE_NODE.includes(removedNodes[0]?.getAttribute?.('class'))) return true;
      return false;
    };

    const observer = new MutationObserver((mutationList) => {
      mutationList.forEach((mutation) => {
        const { attributeName, target, type, addedNodes, removedNodes } = mutation;

        // Ignore devtool dom changes
        if (isDevtoolMutation(mutation)) return;

        const parentNodeId = nodes.getIdByNode(target);

        const updateChildNodeCount = () => {
          this.send({
            method: Event.childNodeCountUpdated,
            params: {
              nodeId: parentNodeId,
              childNodeCount: nodes.getChildNodes(target).length,
            }
          });
        };

        switch (type) {
          case 'childList':
            addedNodes.forEach((node) => {
              updateChildNodeCount();
              this.send({
                method: Event.childNodeInserted,
                params: {
                  node: nodes.collectNodes(node, 0),
                  parentNodeId,
                  previousNodeId: nodes.getIdByNode(nodes.getPreviousNode(node))
                }
              });
            });

            removedNodes.forEach((node) => {
              updateChildNodeCount();
              const nodeId = nodes.getIdByNode(node);
              this.send({
                method: Event.childNodeRemoved,
                params: {
                  nodeId,
                  parentNodeId,
                }
              });
            });

            break;
          case 'attributes':
            // eslint-disable-next-line
            const value = target.getAttribute(attributeName);
            this.send({
              method: value ? Event.attributeModified : Event.attributeRemoved,
              params: {
                nodeId: parentNodeId,
                value: value || undefined,
                name: attributeName,
              }
            });
            break;

          case 'characterData':
            this.send({
              method: Event.characterDataModified,
              params: {
                nodeId: parentNodeId,
                characterData: target.nodeValue
              }
            });
            break;
        }
      });
    });

    // Observe the changes of the document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  }
}
