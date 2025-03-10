// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
export class WebAudioModel extends SDK.SDKModel.SDKModel {
    enabled;
    agent;
    constructor(target) {
        super(target);
        this.enabled = false;
        this.agent = target.webAudioAgent();
        target.registerWebAudioDispatcher(this);
        // TODO(crbug.com/963510): Some OfflineAudioContexts are not uninitialized
        // properly because LifeCycleObserver::ContextDestroyed() is not fired for
        // unknown reasons. This creates inconsistency in AudioGraphTracer
        // and AudioContextSelector in DevTools.
        //
        // To resolve this inconsistency, we flush the leftover from the previous
        // frame when the current page is loaded. This call can be omitted when the
        // bug is fixed.
        SDK.TargetManager.TargetManager.instance().addModelListener(SDK.ResourceTreeModel.ResourceTreeModel, SDK.ResourceTreeModel.Events.FrameNavigated, this.flushContexts, this);
    }
    flushContexts() {
        this.dispatchEventToListeners("ModelReset" /* Events.MODEL_RESET */);
    }
    async suspendModel() {
        this.dispatchEventToListeners("ModelSuspend" /* Events.MODEL_SUSPEND */);
        await this.agent.invoke_disable();
    }
    async resumeModel() {
        if (!this.enabled) {
            return await Promise.resolve();
        }
        await this.agent.invoke_enable();
    }
    ensureEnabled() {
        if (this.enabled) {
            return;
        }
        void this.agent.invoke_enable();
        this.enabled = true;
    }
    contextCreated({ context }) {
        this.dispatchEventToListeners("ContextCreated" /* Events.CONTEXT_CREATED */, context);
    }
    contextWillBeDestroyed({ contextId }) {
        this.dispatchEventToListeners("ContextDestroyed" /* Events.CONTEXT_DESTROYED */, contextId);
    }
    contextChanged({ context }) {
        this.dispatchEventToListeners("ContextChanged" /* Events.CONTEXT_CHANGED */, context);
    }
    audioListenerCreated({ listener }) {
        this.dispatchEventToListeners("AudioListenerCreated" /* Events.AUDIO_LISTENER_CREATED */, listener);
    }
    audioListenerWillBeDestroyed({ listenerId, contextId }) {
        this.dispatchEventToListeners("AudioListenerWillBeDestroyed" /* Events.AUDIO_LISTENER_WILL_BE_DESTROYED */, { listenerId, contextId });
    }
    audioNodeCreated({ node }) {
        this.dispatchEventToListeners("AudioNodeCreated" /* Events.AUDIO_NODE_CREATED */, node);
    }
    audioNodeWillBeDestroyed({ contextId, nodeId }) {
        this.dispatchEventToListeners("AudioNodeWillBeDestroyed" /* Events.AUDIO_NODE_WILL_BE_DESTROYED */, { contextId, nodeId });
    }
    audioParamCreated({ param }) {
        this.dispatchEventToListeners("AudioParamCreated" /* Events.AUDIO_PARAM_CREATED */, param);
    }
    audioParamWillBeDestroyed({ contextId, nodeId, paramId }) {
        this.dispatchEventToListeners("AudioParamWillBeDestroyed" /* Events.AUDIO_PARAM_WILL_BE_DESTROYED */, { contextId, nodeId, paramId });
    }
    nodesConnected({ contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }) {
        this.dispatchEventToListeners("NodesConnected" /* Events.NODES_CONNECTED */, { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex });
    }
    nodesDisconnected({ contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }) {
        this.dispatchEventToListeners("NodesDisconnected" /* Events.NODES_DISCONNECTED */, { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex });
    }
    nodeParamConnected({ contextId, sourceId, destinationId, sourceOutputIndex }) {
        this.dispatchEventToListeners("NodeParamConnected" /* Events.NODE_PARAM_CONNECTED */, { contextId, sourceId, destinationId, sourceOutputIndex });
    }
    nodeParamDisconnected({ contextId, sourceId, destinationId, sourceOutputIndex }) {
        this.dispatchEventToListeners("NodeParamDisconnected" /* Events.NODE_PARAM_DISCONNECTED */, { contextId, sourceId, destinationId, sourceOutputIndex });
    }
    async requestRealtimeData(contextId) {
        const realtimeResponse = await this.agent.invoke_getRealtimeData({ contextId });
        return realtimeResponse.realtimeData;
    }
}
SDK.SDKModel.SDKModel.register(WebAudioModel, { capabilities: 2 /* SDK.Target.Capability.DOM */, autostart: false });
//# sourceMappingURL=WebAudioModel.js.map