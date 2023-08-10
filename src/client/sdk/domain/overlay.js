import nodes from "../common/nodes";
import BaseDomain from "./domain";
import { DEVTOOL_OVERLAY } from "../common/constant";
import { Event } from "./protocol";

const wrapper = document.createElement("div");
const contentBox = document.createElement("div");
const marginBox = document.createElement("div");
const tooltipsBox = document.createElement("div");
const className = DEVTOOL_OVERLAY;

[marginBox, contentBox, tooltipsBox].forEach((item) => {
  item.className = className;
  wrapper.appendChild(item);
});
wrapper.style.cssText =
  "display:none;position:fixed;z-index:999999999;pointer-events:none;";
wrapper.className = className;
wrapper.id = className;

export default class Overlay extends BaseDomain {
  namespace = "Overlay";

  highlightConfig = {};

  /**
   * Format CSS
   * @static
   * @param {Object} styles style object eg: {color: red, position: absolute}
   */
  static formatCssText(styles) {
    return Object.entries(styles)
      .map((item) => `${item[0]}:${item[1]}`)
      .join(";");
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
  requestChildNodes({ nodeId }) {
    if (nodes.hasRequestedChildNode.has(nodeId)) {
      return;
    }
    nodes.hasRequestedChildNode.add(nodeId);
    this.send({
      method: Event.setChildNodes,
      params: {
        parentId: nodeId,
        nodes: nodes.getChildNodes(nodes.getNodeById(nodeId))
      }
    });
  }


  /**
   * Extract attribute value from style
   * @static
   */
  static getStylePropertyValue(properties, styles) {
    if (Array.isArray(properties)) {
      return properties.map((key) => Number(styles[key].replace("px", "")));
    }

    return Number(styles[properties].replace("px", ""));
  }

  /**
   * rgba color
   * @static
   */
  static rgba({ r, g, b, a } = {}) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * @public
   */
  enable() {
    document.body.appendChild(wrapper);

    const highlight = (e) => {
      if (window.$$inspectMode !== "searchForNode") return;
      e.stopPropagation();
      e.preventDefault();

      let { target } = e;

      if (e.touches) {
        const touch = e.touches[0];
        target = document.elementFromPoint(touch.clientX, touch.clientY);
      }

      this.highlightNode({
        nodeElement: target,
        highlightConfig: this.highlightConfig,
      });

      this.expandNode(e.target.parentNode)

      this.send({
        method: Event.nodeHighlightRequested,
        params: {
          nodeId: nodes.getIdByNode(target),
        },
      });
    };

    document.addEventListener("mousemove", highlight, true);
    document.addEventListener("touchmove", highlight, { passive: false });
  }

  /**
   * @public
   * @param {Object} param
   * @param {String} param.nodeId node unique id
   * @param {String} param.nodeElement
   * @param {Object} param.highlightConfig
   */
  highlightNode({ nodeId, nodeElement, highlightConfig }) {
    const node = nodeElement || nodes.getNodeById(nodeId);
    if (
      !node ||
      [Node.TEXT_NODE, Node.COMMENT_NODE, Node.DOCUMENT_TYPE_NODE].includes(node.nodeType) ||
      ['LINK', 'SCRIPT', 'HEAD'].includes(node.nodeName)
    ) {
      return;
    }

    const styles = window.getComputedStyle(node);
    const margin = Overlay.getStylePropertyValue(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'], styles);
    const padding = Overlay.getStylePropertyValue(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], styles);
    const border = Overlay.getStylePropertyValue(['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'], styles);
    const width = Overlay.getStylePropertyValue('width', styles);
    const height = Overlay.getStylePropertyValue('height', styles);
    const isBorderBox = window.getComputedStyle(node)['box-sizing'] === 'border-box';
    const { left, top } = node.getBoundingClientRect();

    const { contentColor, paddingColor, marginColor } = highlightConfig;
    wrapper.style.display = 'block';

    const commonStyle = {
      padding: 0,
      margin: 0,
      position: 'fixed',
      'border-sizing': 'border-box',
    };

    const contentWidth = isBorderBox ? width - padding[1] - padding[3] : width + border[1] + border[3];
    const contentHeight = isBorderBox ? height - padding[0] - padding[2] : height + border[0] + border[2];
    const marginWidth = isBorderBox ? width : width + padding[1] + padding[3] + border[1] + border[3];
    const marginHeight = isBorderBox ? height : height + padding[0] + padding[2] + border[0] + border[2];

    contentBox.style.cssText = Overlay.formatCssText({
      ...commonStyle,
      left: `${left}px`,
      top: `${top}px`,
      width: `${contentWidth}px`,
      height: `${contentHeight}px`,
      background: Overlay.rgba(contentColor),
      'border-top': `${padding[0]}px solid ${Overlay.rgba(paddingColor)}`,
      'border-right': `${padding[1]}px solid ${Overlay.rgba(paddingColor)}`,
      'border-bottom': `${padding[2]}px solid ${Overlay.rgba(paddingColor)}`,
      'border-left': `${padding[3]}px solid ${Overlay.rgba(paddingColor)}`,
    });

    marginBox.style.cssText = Overlay.formatCssText({
      ...commonStyle,
      left: `${left - margin[3]}px`,
      top: `${top - margin[0]}px`,
      width: `${marginWidth}px`,
      height: `${marginHeight}px`,
      'border-top': `${margin[0]}px solid ${Overlay.rgba(marginColor)}`,
      'border-right': `${margin[1]}px solid ${Overlay.rgba(marginColor)}`,
      'border-bottom': `${margin[2]}px solid ${Overlay.rgba(marginColor)}`,
      'border-left': `${margin[3]}px solid ${Overlay.rgba(marginColor)}`,
    });

    const currentClassName = node.getAttribute('class');
    tooltipsBox.innerHTML = `
    <span class="${className}" style="color:#973090;font-weight:bold">${node.nodeName.toLowerCase()}</span>
    <span class="${className}" style="color:#3434B0;font-weight:bold">${currentClassName ? `.${currentClassName}` : ''}</span>
    ${contentWidth} x ${contentHeight}
  `;
    tooltipsBox.style.cssText = Overlay.formatCssText({
      ...commonStyle,
      background: '#fff',
      left: `${left - margin[3]}px`,
      top: top - margin[0] > 25 ? `${top - margin[0] - 25}px` : `${top + marginHeight + 25}px`,
      'box-shadow': '0 0 4px 1px #c3bebe',
      'border-radius': '2px',
      'font-size': '12px',
      padding: '2px 4px',
      color: '#8d8d8d'
    });
  }

  /**
   * @public
   */
  hideHighlight() {
    wrapper.style.display = 'none';
  }

  /**
   * Set dom inspection mode
   * @public
   * @param {Object} param
   * @param {String} param.mode inspect mode
   * @param {Object} param.highlightConfig
   */
  setInspectMode({ mode, highlightConfig }) {
    window.$$inspectMode = mode;
    this.highlightConfig = highlightConfig;
  }
};
