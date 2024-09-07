const styleSheetMap = new Map();

export function createStyleSheet(styleSheetId) {
  const styleSheet = new CSSStyleSheet();
  styleSheetMap.set(styleSheetId, styleSheet);
  return styleSheet;
}

export function getStyleSheetById(styleSheetId) {
  return styleSheetMap.get(styleSheetId);
}

export function setStyleSheet(styleSheetId, styleSheet) {
  styleSheetMap.set(styleSheetId, styleSheet);
}

const inlineStyleSheetIds = new Map();
const inlineStyleNodeIds = new Map();

export function getInlineStyleSheetId(nodeId) {
  return inlineStyleSheetIds.get(nodeId);
}

export function getInlineStyleNodeId(styleSheetId) {
  return inlineStyleNodeIds.get(styleSheetId);
}

export function setInlineStyleSheetId(nodeId, styleSheetId) {
  inlineStyleSheetIds.set(nodeId, styleSheetId);
  inlineStyleNodeIds.set(styleSheetId, nodeId);
}
