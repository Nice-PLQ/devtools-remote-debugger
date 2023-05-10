// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { DOMModel } from './DOMModel.js';
import { DeferredDOMNode } from './DOMModel.js';
import { Capability } from './Target.js';
import { SDKModel } from './SDKModel.js';
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var CoreAxPropertyName;
(function (CoreAxPropertyName) {
    CoreAxPropertyName["Name"] = "name";
    CoreAxPropertyName["Description"] = "description";
    CoreAxPropertyName["Value"] = "value";
    CoreAxPropertyName["Role"] = "role";
})(CoreAxPropertyName || (CoreAxPropertyName = {}));
export class AccessibilityNode {
    #accessibilityModelInternal;
    #agent;
    #idInternal;
    #backendDOMNodeIdInternal;
    #deferredDOMNodeInternal;
    #ignoredInternal;
    #ignoredReasonsInternal;
    #roleInternal;
    #nameInternal;
    #descriptionInternal;
    #valueInternal;
    #propertiesInternal;
    #childIds;
    #parentNodeInternal;
    constructor(accessibilityModel, payload) {
        this.#accessibilityModelInternal = accessibilityModel;
        this.#agent = accessibilityModel.getAgent();
        this.#idInternal = payload.nodeId;
        accessibilityModel.setAXNodeForAXId(this.#idInternal, this);
        if (payload.backendDOMNodeId) {
            accessibilityModel.setAXNodeForBackendDOMNodeId(payload.backendDOMNodeId, this);
            this.#backendDOMNodeIdInternal = payload.backendDOMNodeId;
            this.#deferredDOMNodeInternal = new DeferredDOMNode(accessibilityModel.target(), payload.backendDOMNodeId);
        }
        else {
            this.#backendDOMNodeIdInternal = null;
            this.#deferredDOMNodeInternal = null;
        }
        this.#ignoredInternal = payload.ignored;
        if (this.#ignoredInternal && 'ignoredReasons' in payload) {
            this.#ignoredReasonsInternal = payload.ignoredReasons;
        }
        this.#roleInternal = payload.role || null;
        this.#nameInternal = payload.name || null;
        this.#descriptionInternal = payload.description || null;
        this.#valueInternal = payload.value || null;
        this.#propertiesInternal = payload.properties || null;
        this.#childIds = payload.childIds || null;
        this.#parentNodeInternal = null;
    }
    id() {
        return this.#idInternal;
    }
    accessibilityModel() {
        return this.#accessibilityModelInternal;
    }
    ignored() {
        return this.#ignoredInternal;
    }
    ignoredReasons() {
        return this.#ignoredReasonsInternal || null;
    }
    role() {
        return this.#roleInternal || null;
    }
    coreProperties() {
        const properties = [];
        if (this.#nameInternal) {
            properties.push({ name: CoreAxPropertyName.Name, value: this.#nameInternal });
        }
        if (this.#descriptionInternal) {
            properties.push({ name: CoreAxPropertyName.Description, value: this.#descriptionInternal });
        }
        if (this.#valueInternal) {
            properties.push({ name: CoreAxPropertyName.Value, value: this.#valueInternal });
        }
        return properties;
    }
    name() {
        return this.#nameInternal || null;
    }
    description() {
        return this.#descriptionInternal || null;
    }
    value() {
        return this.#valueInternal || null;
    }
    properties() {
        return this.#propertiesInternal || null;
    }
    parentNode() {
        return this.#parentNodeInternal;
    }
    setParentNode(parentNode) {
        this.#parentNodeInternal = parentNode;
    }
    isDOMNode() {
        return Boolean(this.#backendDOMNodeIdInternal);
    }
    backendDOMNodeId() {
        return this.#backendDOMNodeIdInternal;
    }
    deferredDOMNode() {
        return this.#deferredDOMNodeInternal;
    }
    highlightDOMNode() {
        const deferredNode = this.deferredDOMNode();
        if (!deferredNode) {
            return;
        }
        // Highlight node in page.
        deferredNode.highlight();
    }
    children() {
        if (!this.#childIds) {
            return [];
        }
        const children = [];
        for (const childId of this.#childIds) {
            const child = this.#accessibilityModelInternal.axNodeForId(childId);
            if (child) {
                children.push(child);
            }
        }
        return children;
    }
    numChildren() {
        if (!this.#childIds) {
            return 0;
        }
        return this.#childIds.length;
    }
    hasOnlyUnloadedChildren() {
        if (!this.#childIds || !this.#childIds.length) {
            return false;
        }
        return this.#childIds.every(id => this.#accessibilityModelInternal.axNodeForId(id) === null);
    }
    // Only the root node gets a frameId, so nodes have to walk up the tree to find their frameId.
    getFrameId() {
        const domNode = this.accessibilityModel().domNodeforAXNode(this);
        if (!domNode) {
            return null;
        }
        return domNode.frameId();
    }
}
export class AccessibilityModel extends SDKModel {
    agent;
    #axIdToAXNode;
    #backendDOMNodeIdToAXNode;
    #backendDOMNodeIdToDOMNode;
    constructor(target) {
        super(target);
        this.agent = target.accessibilityAgent();
        this.resumeModel();
        this.#axIdToAXNode = new Map();
        this.#backendDOMNodeIdToAXNode = new Map();
        this.#backendDOMNodeIdToDOMNode = new Map();
    }
    clear() {
        this.#axIdToAXNode.clear();
    }
    async resumeModel() {
        await this.agent.invoke_enable();
    }
    async suspendModel() {
        await this.agent.invoke_disable();
    }
    async requestPartialAXTree(node) {
        const { nodes } = await this.agent.invoke_getPartialAXTree({ nodeId: node.id, fetchRelatives: true });
        if (!nodes) {
            return;
        }
        for (const payload of nodes) {
            new AccessibilityNode(this, payload);
        }
        for (const axNode of this.#axIdToAXNode.values()) {
            for (const axChild of axNode.children()) {
                axChild.setParentNode(axNode);
            }
        }
    }
    async pushNodesToFrontend(backendIds) {
        const domModel = this.target().model(DOMModel);
        if (!domModel) {
            return;
        }
        const newNodesToTrack = await domModel.pushNodesByBackendIdsToFrontend(backendIds);
        newNodesToTrack?.forEach((value, key) => this.#backendDOMNodeIdToDOMNode.set(key, value));
    }
    createNodesFromPayload(payloadNodes) {
        const backendIds = new Set();
        const accessibilityNodes = payloadNodes.map(node => {
            const sdkNode = new AccessibilityNode(this, node);
            const backendId = sdkNode.backendDOMNodeId();
            if (backendId) {
                backendIds.add(backendId);
            }
            return sdkNode;
        });
        this.pushNodesToFrontend(backendIds);
        for (const sdkNode of accessibilityNodes) {
            for (const sdkChild of sdkNode.children()) {
                sdkChild.setParentNode(sdkNode);
            }
        }
        return accessibilityNodes;
    }
    async requestRootNode(depth = 2, frameId) {
        const { nodes } = await this.agent.invoke_getFullAXTree({ depth, frameId });
        if (!nodes) {
            return;
        }
        const axNodes = this.createNodesFromPayload(nodes);
        const root = axNodes[0];
        return root;
    }
    async requestAXChildren(nodeId, frameId) {
        const { nodes } = await this.agent.invoke_getChildAXNodes({ id: nodeId, frameId });
        if (!nodes) {
            return [];
        }
        const axNodes = this.createNodesFromPayload(nodes);
        return axNodes;
    }
    async requestAndLoadSubTreeToNode(node) {
        // Node may have already been loaded, so don't bother requesting it again.
        const loadedAXNode = this.axNodeForDOMNode(node);
        if (loadedAXNode) {
            return loadedAXNode;
        }
        const { nodes } = await this.agent.invoke_getPartialAXTree({ nodeId: node.id, fetchRelatives: true });
        if (!nodes) {
            return null;
        }
        const ancestors = this.createNodesFromPayload(nodes);
        // Request top level children nodes.
        for (const node of ancestors) {
            await this.requestAXChildren(node.id());
        }
        return this.axNodeForDOMNode(node);
    }
    async updateSubtreeAndAncestors(backendNodeId) {
        const { nodes } = await this.agent.invoke_getPartialAXTree({ backendNodeId, fetchRelatives: true });
        if (!nodes) {
            return;
        }
        this.createNodesFromPayload(nodes);
    }
    axNodeForId(axId) {
        return this.#axIdToAXNode.get(axId) || null;
    }
    setAXNodeForAXId(axId, axNode) {
        this.#axIdToAXNode.set(axId, axNode);
    }
    axNodeForDOMNode(domNode) {
        if (!domNode) {
            return null;
        }
        return this.#backendDOMNodeIdToAXNode.get(domNode.backendNodeId()) ?? null;
    }
    domNodeforAXNode(axNode) {
        const backendDOMNodeId = axNode.backendDOMNodeId();
        if (!backendDOMNodeId) {
            return null;
        }
        return this.#backendDOMNodeIdToDOMNode.get(backendDOMNodeId) ?? null;
    }
    setAXNodeForBackendDOMNodeId(backendDOMNodeId, axNode) {
        this.#backendDOMNodeIdToAXNode.set(backendDOMNodeId, axNode);
    }
    getAgent() {
        return this.agent;
    }
}
SDKModel.register(AccessibilityModel, { capabilities: Capability.DOM, autostart: false });
//# sourceMappingURL=AccessibilityModel.js.map