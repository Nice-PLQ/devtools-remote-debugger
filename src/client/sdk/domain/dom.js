import nodes from '../common/nodes';
import { getObjectById } from '../common/remoteObject';
import BaseDomain from './domain';
import { Event } from './protocol';

export default class Dom extends BaseDomain {
  namespace = 'DOM';

  /**
   * set $ and $$ methods
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
  }

  /**
   * Enable Dom domain
   * @public
   */
  enable() {
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
    this.send({
      method: Event.setChildNodes,
      params: {
        parentId: nodeId,
        nodes: nodes.getChildNodes(nodes.getNodeById(nodeId))
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
   * @private
   */
  setDomInspect() {
    document.addEventListener('click', (e) => {
      if (window.$$inspectMode !== 'searchForNode') return;

      e.stopPropagation();
      e.preventDefault();

      let previousNode = e.target.parentNode;
      const currentNodeId = nodes.getIdByNode(e.target);
      const nodeIds = [];
      while (!nodes.hasNode(previousNode)) {
        const nodeId = nodes.getIdByNode(previousNode);
        nodeIds.unshift(nodeId);
        previousNode = previousNode.parentNode;
      }

      nodeIds.unshift(nodes.getIdByNode(previousNode));

      nodeIds.forEach((nodeId) => {
        this.requestChildNodes({ nodeId });
      });

      this.send({
        method: 'Overlay.nodeHighlightRequested',
        params: {
          nodeId: currentNodeId
        }
      });
      this.send({
        method: 'Overlay.inspectNodeRequested',
        params: {
          backendNodeId: currentNodeId
        }
      });

      document.getElementById('devtools-overlay').style.display = 'none';
    }, true);
  }

  /**
   * @private
   */
  nodeObserver() {
    const isDevtoolMutation = ({ target, addedNodes, removedNodes }) => {
      const cls = 'devtools-overlay';
      if (target.getAttribute?.('class') === cls) return true;
      if (addedNodes[0]?.getAttribute?.('class') === cls) return true;
      if (removedNodes[0]?.getAttribute?.('class') === cls) return true;
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
