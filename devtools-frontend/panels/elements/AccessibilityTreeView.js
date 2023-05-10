// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as TreeOutline from '../../ui/components/tree_outline/tree_outline.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as AccessibilityTreeUtils from './AccessibilityTreeUtils.js';
import { ElementsPanel } from './ElementsPanel.js';
export class AccessibilityTreeView extends UI.Widget.VBox {
    accessibilityTreeComponent = new TreeOutline.TreeOutline.TreeOutline();
    treeData = [];
    toggleButton;
    accessibilityModel = null;
    rootAXNode = null;
    selectedTreeNode = null;
    inspectedDOMNode = null;
    constructor(toggleButton) {
        super();
        // toggleButton is bound to a click handler on ElementsPanel to switch between the DOM tree
        // and accessibility tree views.
        this.toggleButton = toggleButton;
        this.contentElement.appendChild(this.toggleButton);
        this.contentElement.appendChild(this.accessibilityTreeComponent);
        // The DOM tree and accessibility are kept in sync as much as possible, so
        // on node selection, update the currently inspected node and reveal in the
        // DOM tree.
        this.accessibilityTreeComponent.addEventListener('itemselected', (event) => {
            const evt = event;
            const axNode = evt.data.node.treeNodeData;
            if (!axNode.isDOMNode()) {
                return;
            }
            const deferredNode = axNode.deferredDOMNode();
            if (deferredNode) {
                deferredNode.resolve(domNode => {
                    if (domNode) {
                        this.inspectedDOMNode = domNode;
                        ElementsPanel.instance().revealAndSelectNode(domNode, true, false);
                    }
                });
            }
        });
        this.accessibilityTreeComponent.addEventListener('itemmouseover', (event) => {
            const evt = event;
            evt.data.node.treeNodeData.highlightDOMNode();
        });
        this.accessibilityTreeComponent.addEventListener('itemmouseout', () => {
            SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
        });
    }
    wasShown() {
        if (this.inspectedDOMNode) {
            this.loadSubTreeIntoAccessibilityModel(this.inspectedDOMNode);
        }
        else {
            this.accessibilityTreeComponent.expandRecursively(1);
        }
    }
    setAccessibilityModel(model) {
        this.accessibilityModel = model;
    }
    wireToDOMModel(domModel) {
        if (!domModel.parentModel()) {
            this.setAccessibilityModel(domModel.target().model(SDK.AccessibilityModel.AccessibilityModel));
        }
        domModel.addEventListener(SDK.DOMModel.Events.NodeInserted, this.domUpdated, this);
        domModel.addEventListener(SDK.DOMModel.Events.NodeRemoved, this.domUpdatedNode, this);
        domModel.addEventListener(SDK.DOMModel.Events.AttrModified, this.domUpdatedNode, this);
        domModel.addEventListener(SDK.DOMModel.Events.AttrRemoved, this.domUpdatedNode, this);
        domModel.addEventListener(SDK.DOMModel.Events.CharacterDataModified, this.domUpdated, this);
        domModel.addEventListener(SDK.DOMModel.Events.ChildNodeCountUpdated, this.domUpdated, this);
        domModel.addEventListener(SDK.DOMModel.Events.DistributedNodesChanged, this.domUpdated, this);
        domModel.addEventListener(SDK.DOMModel.Events.DocumentUpdated, this.documentUpdated, this);
    }
    unwireFromDOMModel(domModel) {
        domModel.removeEventListener(SDK.DOMModel.Events.NodeInserted, this.domUpdated, this);
        domModel.removeEventListener(SDK.DOMModel.Events.NodeRemoved, this.domUpdatedNode, this);
        domModel.removeEventListener(SDK.DOMModel.Events.AttrModified, this.domUpdatedNode, this);
        domModel.removeEventListener(SDK.DOMModel.Events.AttrRemoved, this.domUpdatedNode, this);
        domModel.removeEventListener(SDK.DOMModel.Events.CharacterDataModified, this.domUpdated, this);
        domModel.removeEventListener(SDK.DOMModel.Events.ChildNodeCountUpdated, this.domUpdated, this);
        domModel.removeEventListener(SDK.DOMModel.Events.DistributedNodesChanged, this.domUpdated, this);
        domModel.removeEventListener(SDK.DOMModel.Events.DocumentUpdated, this.documentUpdated, this);
    }
    domUpdatedNode(event) {
        this.update(event.data.node);
    }
    domUpdated(event) {
        this.update(event.data);
    }
    async update(node) {
        const axModel = node.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
        await axModel?.updateSubtreeAndAncestors(node.backendNodeId());
        this.renderTree();
    }
    documentUpdated(event) {
        const domModel = event.data;
        const axModel = domModel.target().model(SDK.AccessibilityModel.AccessibilityModel);
        if (domModel.existingDocument() && !domModel.parentModel() && axModel) {
            this.refreshAccessibilityTree(axModel);
        }
    }
    renderTree() {
        if (!this.rootAXNode) {
            this.treeData = [];
        }
        else {
            this.treeData = [AccessibilityTreeUtils.sdkNodeToAXTreeNode(this.rootAXNode)];
        }
        this.accessibilityTreeComponent.data = {
            defaultRenderer: AccessibilityTreeUtils.accessibilityNodeRenderer,
            tree: this.treeData,
        };
        const axModel = this.inspectedDOMNode?.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
        const inspectedAXNode = axModel?.axNodeForDOMNode(this.inspectedDOMNode);
        if (inspectedAXNode) {
            this.selectedTreeNode = AccessibilityTreeUtils.sdkNodeToAXTreeNode(inspectedAXNode);
            this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.selectedTreeNode);
        }
        else {
            this.accessibilityTreeComponent.expandRecursively(1);
        }
    }
    async refreshAccessibilityTree(accessibilityModel) {
        // We always expand the root node so we might as well fetch one level of children immediately.
        const root = await accessibilityModel.requestRootNode(1);
        if (!root) {
            return;
        }
        this.rootAXNode = root;
        this.inspectedDOMNode = null;
        this.renderTree();
    }
    // Given a selected DOM node, asks the model to load the missing subtree from the root to the
    // selected node and then re-renders the tree.
    async loadSubTreeIntoAccessibilityModel(selectedNode) {
        if (!this.accessibilityModel) {
            return;
        }
        // If this node has been loaded previously, the accessibility tree will return it's cached node.
        // Eventually we'll need some mechanism for forcing it to fetch a new node when we are subscribing
        // for updates, but TBD later.
        // EG for a backend tree like:
        //
        // A*
        //   B
        //     C
        //   D
        //     E
        // Where only A is already loaded into the model, calling requestAndLoadSubTreeToNode(C) will
        // load [A, B, D, C] into the model, and return C.
        const inspectedAXNode = await this.accessibilityModel.requestAndLoadSubTreeToNode(selectedNode);
        if (!inspectedAXNode) {
            return;
        }
        this.accessibilityTreeComponent.data = {
            defaultRenderer: AccessibilityTreeUtils.accessibilityNodeRenderer,
            tree: this.treeData,
        };
        // These nodes require a special case, as they don't have an unignored node in the
        // accessibility tree. Someone inspecting these in the DOM is probably expecting to
        // be focused on the root WebArea of the accessibility tree.
        // TODO(meredithl): Fix for when the inspected node is ingored in the accessibility
        // tree. Eg, inspecting <head> in the DOM tree.
        if (selectedNode.nodeName() === 'BODY' || selectedNode.nodeName() === 'HTML') {
            this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.treeData[0]);
            this.selectedTreeNode = this.treeData[0];
            return;
        }
        this.selectedTreeNode = AccessibilityTreeUtils.sdkNodeToAXTreeNode(inspectedAXNode);
        this.accessibilityTreeComponent.expandToAndSelectTreeNode(this.selectedTreeNode);
    }
    // Selected node in the DOM has changed, and the corresponding accessibility node may be
    // unloaded.
    async selectedNodeChanged(inspectedNode) {
        if (inspectedNode === this.inspectedDOMNode) {
            return;
        }
        this.inspectedDOMNode = inspectedNode;
        // We only want to load nodes into the model when the AccessibilityTree is visible.
        if (this.isShowing()) {
            await this.loadSubTreeIntoAccessibilityModel(inspectedNode);
        }
    }
}
//# sourceMappingURL=AccessibilityTreeView.js.map