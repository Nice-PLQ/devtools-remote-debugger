// Implemented CDP
export default {
  CSS: ['enable', 'getStyleSheetText', 'getMatchedStylesForNode', 'getComputedStyleForNode', 'getDynamicLink'],
  Debugger: ['enable', 'getScriptSource', 'getDynamicScript'],
  DOMStorage: ['getDOMStorageItems', 'removeDOMStorageItem', 'clear', 'setDOMStorageItem'],
  Storage: ['getStorageKeyForFrame'],
  DOM: [
    'enable', 'getDocument', 'removeNode', 'requestChildNodes', 'requestNode', 'getOuterHTML',
    'setOuterHTML', 'setAttributesAsText', 'setInspectedNode', 'pushNodesByBackendIdsToFrontend'
  ],
  Network: ['enable', 'getCookies', 'setCookie', 'deleteCookies', 'getResponseBody'],
  Overlay: ['enable', 'highlightNode', 'hideHighlight', 'setInspectMode'],
  Page: ['enable', 'startScreencast', 'stopScreencast', 'getResourceTree', 'getResourceContent'],
  Runtime: ['enable', 'evaluate', 'getProperties', 'releaseObject'],
  Screenshot: ['startPreview', 'stopPreview'] // Screenshot is a custom protocol
};

export const Event = {
  styleSheetAdded: 'CSS.styleSheetAdded',

  scriptParsed: 'Debugger.scriptParsed',

  domStorageItemRemoved: 'DOMStorage.domStorageItemRemoved',
  domStorageItemsCleared: 'DOMStorage.domStorageItemsCleared',

  setChildNodes: 'DOM.setChildNodes',
  childNodeCountUpdated: 'DOM.childNodeCountUpdated',
  childNodeInserted: 'DOM.childNodeInserted',
  childNodeRemoved: 'DOM.childNodeRemoved',
  attributeModified: 'DOM.attributeModified',
  attributeRemoved: 'DOM.attributeRemoved',
  characterDataModified: 'DOM.characterDataModified',

  requestWillBeSent: 'Network.requestWillBeSent',
  responseReceivedExtraInfo: 'Network.responseReceivedExtraInfo',
  responseReceived: 'Network.responseReceived',
  loadingFinished: 'Network.loadingFinished',

  screencastFrame: 'Page.screencastFrame',

  executionContextCreated: 'Runtime.executionContextCreated',
  consoleAPICalled: 'Runtime.consoleAPICalled',
  exceptionThrown: 'Runtime.exceptionThrown',

  captured: 'Screenshot.captured',
};
