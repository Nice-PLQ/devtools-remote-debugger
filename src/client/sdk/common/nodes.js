import { IGNORE_NODE } from './constant';

class Nodes {
  // DOM node id collection
  nodeIds = new Map();

  // DOM node collection
  nodes = new Map();

  hasRequestedChildNode = new Set()

  currentId = 0;

  /**
   * Is it a node
   * @public
   * @param {HTMLElement} node DOM
   */
  isNode(node) {
    if (!node) return false;
    // Ignore DOM nodes for debugging
    if (node.getAttribute && IGNORE_NODE.includes(node.getAttribute('class'))) return false;
    // non-text node
    if (node.nodeType !== Node.TEXT_NODE) return true;
    // non-empty text node
    if (node.nodeType === Node.TEXT_NODE && (node.nodeValue || '').trim() !== '') return true;
    return false;
  }

  create(nodeId, node) {
    this.nodeIds.set(node, nodeId);
    this.nodes.set(nodeId, node);
  }

  init() {
    this.nodeIds.clear();
    this.nodes.clear();
    this.hasRequestedChildNode.clear();
  }

  hasNode(node) {
    return this.nodeIds.has(node);
  }

  /**
   * @public
   * @param {Number} nodeId Unique id of DOM
   */
  getNodeById(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * @public
   * @param {HTMLElement} node DOM
   */
  getIdByNode(node) {
    let nodeId = this.nodeIds.get(node);
    if (nodeId) return nodeId;

    // eslint-disable-next-line
    nodeId = this.currentId++;
    this.create(nodeId, node);

    return nodeId;
  }

  /**
   * Collect child nodes
   * @public
   * @param {Element} node DOM node
   * @param {Number} depth child node depth
   */
  collectNodes(node, depth = 2) {
    const nodeId = this.getIdByNode(node);
    const { nodeType, nodeName, localName, nodeValue, parentNode, attributes, childNodes } = node;
    const res = {
      nodeId,
      nodeType,
      nodeName,
      localName,
      nodeValue,
      backendNodeId: nodeId,
      childNodeCount: childNodes.length
    };

    if (attributes) {
      res.attributes = Array.from(attributes).reduce((pre, curr) => pre.concat(curr.name, curr.value), []);
    }

    if (parentNode) {
      res.parentId = this.getIdByNode(parentNode);
    }

    if (depth > 0) {
      res.children = this.getChildNodes(node, depth);
    }

    return res;
  }

  /**
   * Collect DOM child elements
   * @public
   * @param {HTMLElement} node DOM
   * @param {Number} depth
   */
  getChildNodes(node, depth = 1) {
    return Array.from(node.childNodes)
      .filter(this.isNode)
      .map(childNode => this.collectNodes(childNode, depth - 1));
  }

  /**
   * Get the former sibling node of DOM
   * @public
   * @param {HTMLElement} node DOM
   */
  getPreviousNode(node) {
    let previousNode = node.previousSibling;
    if (!previousNode) return;

    while (!this.isNode(previousNode) && previousNode.previousSibling) {
      previousNode = previousNode.previousSibling;
    }

    return previousNode;
  }
}

export default new Nodes();
