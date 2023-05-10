import type * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
export declare class AccessibilityTreeView extends UI.Widget.VBox {
    private readonly accessibilityTreeComponent;
    private treeData;
    private readonly toggleButton;
    private accessibilityModel;
    private rootAXNode;
    private selectedTreeNode;
    private inspectedDOMNode;
    constructor(toggleButton: HTMLButtonElement);
    wasShown(): void;
    setAccessibilityModel(model: SDK.AccessibilityModel.AccessibilityModel | null): void;
    wireToDOMModel(domModel: SDK.DOMModel.DOMModel): void;
    unwireFromDOMModel(domModel: SDK.DOMModel.DOMModel): void;
    domUpdatedNode(event: Common.EventTarget.EventTargetEvent<{
        node: SDK.DOMModel.DOMNode;
    }>): void;
    domUpdated(event: Common.EventTarget.EventTargetEvent<SDK.DOMModel.DOMNode>): void;
    update(node: SDK.DOMModel.DOMNode): Promise<void>;
    documentUpdated(event: Common.EventTarget.EventTargetEvent<SDK.DOMModel.DOMModel>): void;
    renderTree(): void;
    refreshAccessibilityTree(accessibilityModel: SDK.AccessibilityModel.AccessibilityModel): Promise<void>;
    loadSubTreeIntoAccessibilityModel(selectedNode: SDK.DOMModel.DOMNode): Promise<void>;
    selectedNodeChanged(inspectedNode: SDK.DOMModel.DOMNode): Promise<void>;
}
