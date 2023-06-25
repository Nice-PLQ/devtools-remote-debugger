import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ElementsTreeOutline from './ElementsTreeOutline.js';
export declare class TopLayerContainer extends UI.TreeOutline.TreeElement {
    tree: ElementsTreeOutline.ElementsTreeOutline;
    domModel: SDK.DOMModel.DOMModel;
    currentTopLayerDOMNodes: Set<SDK.DOMModel.DOMNode>;
    topLayerUpdateThrottler: Common.Throttler.Throttler;
    constructor(tree: ElementsTreeOutline.ElementsTreeOutline, domModel: SDK.DOMModel.DOMModel);
    throttledUpdateTopLayerElements(): Promise<void>;
    updateTopLayerElements(): Promise<void>;
    private removeCurrentTopLayerElementsAdorners;
    private addTopLayerAdorner;
}
