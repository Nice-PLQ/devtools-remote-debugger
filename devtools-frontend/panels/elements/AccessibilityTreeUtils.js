// Copyright 2021 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as ElementsComponents from './components/components.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
export function sdkNodeToAXTreeNode(sdkNode) {
    const treeNodeData = sdkNode;
    const role = sdkNode.role()?.value;
    if (role === 'Iframe') {
        return {
            treeNodeData,
            children: async () => {
                const domNode = await sdkNode.deferredDOMNode()?.resolvePromise();
                if (!domNode) {
                    throw new Error('Could not find corresponding DOMNode');
                }
                const frameId = domNode.frameOwnerFrameId();
                let document = domNode.contentDocument();
                if (!document && frameId) {
                    const frame = SDK.FrameManager.FrameManager.instance().getFrame(frameId);
                    if (!frame) {
                        return [];
                    }
                    document = await frame.resourceTreeModel().domModel().requestDocument();
                }
                if (!document) {
                    return [];
                }
                const axmodel = document.domModel().target().model(SDK.AccessibilityModel.AccessibilityModel);
                if (!axmodel) {
                    throw new Error('Could not find AccessibilityModel for child document');
                }
                // Check if we have requested the node before:
                let localRoot = axmodel.axNodeForDOMNode(document);
                if (!localRoot && frameId) {
                    // Request the root node of the iframe document:
                    localRoot = await axmodel.requestRootNode(1, frameId) || null;
                }
                if (!localRoot) {
                    throw new Error('Could not find root node');
                }
                return [sdkNodeToAXTreeNode(localRoot)];
            },
            id: sdkNode.id(),
        };
    }
    if (!sdkNode.numChildren()) {
        return {
            treeNodeData,
            id: sdkNode.id(),
        };
    }
    return {
        treeNodeData,
        children: async () => {
            if (sdkNode.numChildren() === sdkNode.children().length) {
                return sdkNode.children().map(child => sdkNodeToAXTreeNode(child));
            }
            // numChildren returns the number of children that this node has, whereas node.children()
            // returns only children that have been loaded. If these two don't match, that means that
            // there are backend children that need to be loaded into the model, so request them now.
            await sdkNode.accessibilityModel().requestAXChildren(sdkNode.id(), sdkNode.getFrameId() || undefined);
            if (sdkNode.numChildren() !== sdkNode.children().length) {
                throw new Error('Once loaded, number of children and length of children must match.');
            }
            const treeNodeChildren = [];
            for (const child of sdkNode.children()) {
                treeNodeChildren.push(sdkNodeToAXTreeNode(child));
            }
            return treeNodeChildren;
        },
        id: sdkNode.id(),
    };
}
export function accessibilityNodeRenderer(node) {
    const tag = ElementsComponents.AccessibilityTreeNode.AccessibilityTreeNode.litTagName;
    const sdkNode = node.treeNodeData;
    const name = sdkNode.name()?.value || '';
    const role = sdkNode.role()?.value || '';
    const ignored = sdkNode.ignored();
    return LitHtml.html `<${tag} .data=${{ name, role, ignored }}></${tag}>`;
}
//# sourceMappingURL=AccessibilityTreeUtils.js.map