// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../ui/legacy/legacy.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as VisualLogging from '../../ui/visual_logging/visual_logging.js';
import { ContextDetailBuilder, ContextSummaryBuilder } from './AudioContextContentBuilder.js';
import { AudioContextSelector } from './AudioContextSelector.js';
import * as GraphVisualizer from './graph_visualizer/graph_visualizer.js';
import webAudioStyles from './webAudio.css.js';
import { WebAudioModel } from './WebAudioModel.js';
const UIStrings = {
    /**
     *@description Text in Web Audio View if there is nothing to show.
     * Web Audio API is an API for controlling audio on the web.
     */
    noWebAudio: 'No Web Audio API usage detected',
    /**
     *@description Text in Web Audio View
     */
    openAPageThatUsesWebAudioApiTo: 'Open a page that uses Web Audio API to start monitoring.',
};
const str_ = i18n.i18n.registerUIStrings('panels/web_audio/WebAudioView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
const WEBAUDIO_EXPLANATION_URL = 'https://developer.chrome.com/docs/devtools/webaudio';
export class WebAudioView extends UI.ThrottledWidget.ThrottledWidget {
    contextSelector;
    contentContainer;
    detailViewContainer;
    graphManager;
    landingPage;
    summaryBarContainer;
    constructor() {
        super(true, 1000);
        this.registerRequiredCSS(webAudioStyles);
        this.element.setAttribute('jslog', `${VisualLogging.panel('web-audio').track({ resize: true })}`);
        this.element.classList.add('web-audio-drawer');
        // Creates the toolbar.
        const toolbarContainer = this.contentElement.createChild('div', 'web-audio-toolbar-container vbox');
        toolbarContainer.role = 'toolbar';
        this.contextSelector = new AudioContextSelector();
        const toolbar = toolbarContainer.createChild('devtools-toolbar', 'web-audio-toolbar');
        toolbar.role = 'presentation';
        toolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton('components.collect-garbage'));
        toolbar.appendSeparator();
        toolbar.appendToolbarItem(this.contextSelector.toolbarItem());
        toolbar.setAttribute('jslog', `${VisualLogging.toolbar()}`);
        // Create content container
        this.contentContainer = this.contentElement.createChild('div', 'web-audio-content-container vbox flex-auto');
        // Creates the detail view.
        this.detailViewContainer = this.contentContainer.createChild('div', 'web-audio-details-container vbox flex-auto');
        this.graphManager = new GraphVisualizer.GraphManager.GraphManager();
        // Creates the landing page.
        this.landingPage = new UI.EmptyWidget.EmptyWidget(i18nString(UIStrings.noWebAudio), i18nString(UIStrings.openAPageThatUsesWebAudioApiTo));
        this.landingPage.appendLink(WEBAUDIO_EXPLANATION_URL);
        this.landingPage.show(this.detailViewContainer);
        // Creates the summary bar.
        this.summaryBarContainer = this.contentContainer.createChild('div', 'web-audio-summary-container');
        this.contextSelector.addEventListener("ContextSelected" /* SelectorEvents.CONTEXT_SELECTED */, (event) => {
            const context = event.data;
            if (context) {
                this.updateDetailView(context);
            }
            void this.doUpdate();
        });
        SDK.TargetManager.TargetManager.instance().observeModels(WebAudioModel, this);
    }
    wasShown() {
        super.wasShown();
        for (const model of SDK.TargetManager.TargetManager.instance().models(WebAudioModel)) {
            this.addEventListeners(model);
        }
    }
    willHide() {
        for (const model of SDK.TargetManager.TargetManager.instance().models(WebAudioModel)) {
            this.removeEventListeners(model);
        }
    }
    modelAdded(webAudioModel) {
        if (this.isShowing()) {
            this.addEventListeners(webAudioModel);
        }
    }
    modelRemoved(webAudioModel) {
        this.removeEventListeners(webAudioModel);
    }
    async doUpdate() {
        await this.pollRealtimeData();
        this.update();
    }
    addEventListeners(webAudioModel) {
        webAudioModel.ensureEnabled();
        webAudioModel.addEventListener("ContextCreated" /* ModelEvents.CONTEXT_CREATED */, this.contextCreated, this);
        webAudioModel.addEventListener("ContextDestroyed" /* ModelEvents.CONTEXT_DESTROYED */, this.contextDestroyed, this);
        webAudioModel.addEventListener("ContextChanged" /* ModelEvents.CONTEXT_CHANGED */, this.contextChanged, this);
        webAudioModel.addEventListener("ModelReset" /* ModelEvents.MODEL_RESET */, this.reset, this);
        webAudioModel.addEventListener("ModelSuspend" /* ModelEvents.MODEL_SUSPEND */, this.suspendModel, this);
        webAudioModel.addEventListener("AudioListenerCreated" /* ModelEvents.AUDIO_LISTENER_CREATED */, this.audioListenerCreated, this);
        webAudioModel.addEventListener("AudioListenerWillBeDestroyed" /* ModelEvents.AUDIO_LISTENER_WILL_BE_DESTROYED */, this.audioListenerWillBeDestroyed, this);
        webAudioModel.addEventListener("AudioNodeCreated" /* ModelEvents.AUDIO_NODE_CREATED */, this.audioNodeCreated, this);
        webAudioModel.addEventListener("AudioNodeWillBeDestroyed" /* ModelEvents.AUDIO_NODE_WILL_BE_DESTROYED */, this.audioNodeWillBeDestroyed, this);
        webAudioModel.addEventListener("AudioParamCreated" /* ModelEvents.AUDIO_PARAM_CREATED */, this.audioParamCreated, this);
        webAudioModel.addEventListener("AudioParamWillBeDestroyed" /* ModelEvents.AUDIO_PARAM_WILL_BE_DESTROYED */, this.audioParamWillBeDestroyed, this);
        webAudioModel.addEventListener("NodesConnected" /* ModelEvents.NODES_CONNECTED */, this.nodesConnected, this);
        webAudioModel.addEventListener("NodesDisconnected" /* ModelEvents.NODES_DISCONNECTED */, this.nodesDisconnected, this);
        webAudioModel.addEventListener("NodeParamConnected" /* ModelEvents.NODE_PARAM_CONNECTED */, this.nodeParamConnected, this);
        webAudioModel.addEventListener("NodeParamDisconnected" /* ModelEvents.NODE_PARAM_DISCONNECTED */, this.nodeParamDisconnected, this);
    }
    removeEventListeners(webAudioModel) {
        webAudioModel.removeEventListener("ContextCreated" /* ModelEvents.CONTEXT_CREATED */, this.contextCreated, this);
        webAudioModel.removeEventListener("ContextDestroyed" /* ModelEvents.CONTEXT_DESTROYED */, this.contextDestroyed, this);
        webAudioModel.removeEventListener("ContextChanged" /* ModelEvents.CONTEXT_CHANGED */, this.contextChanged, this);
        webAudioModel.removeEventListener("ModelReset" /* ModelEvents.MODEL_RESET */, this.reset, this);
        webAudioModel.removeEventListener("ModelSuspend" /* ModelEvents.MODEL_SUSPEND */, this.suspendModel, this);
        webAudioModel.removeEventListener("AudioListenerCreated" /* ModelEvents.AUDIO_LISTENER_CREATED */, this.audioListenerCreated, this);
        webAudioModel.removeEventListener("AudioListenerWillBeDestroyed" /* ModelEvents.AUDIO_LISTENER_WILL_BE_DESTROYED */, this.audioListenerWillBeDestroyed, this);
        webAudioModel.removeEventListener("AudioNodeCreated" /* ModelEvents.AUDIO_NODE_CREATED */, this.audioNodeCreated, this);
        webAudioModel.removeEventListener("AudioNodeWillBeDestroyed" /* ModelEvents.AUDIO_NODE_WILL_BE_DESTROYED */, this.audioNodeWillBeDestroyed, this);
        webAudioModel.removeEventListener("AudioParamCreated" /* ModelEvents.AUDIO_PARAM_CREATED */, this.audioParamCreated, this);
        webAudioModel.removeEventListener("AudioParamWillBeDestroyed" /* ModelEvents.AUDIO_PARAM_WILL_BE_DESTROYED */, this.audioParamWillBeDestroyed, this);
        webAudioModel.removeEventListener("NodesConnected" /* ModelEvents.NODES_CONNECTED */, this.nodesConnected, this);
        webAudioModel.removeEventListener("NodesDisconnected" /* ModelEvents.NODES_DISCONNECTED */, this.nodesDisconnected, this);
        webAudioModel.removeEventListener("NodeParamConnected" /* ModelEvents.NODE_PARAM_CONNECTED */, this.nodeParamConnected, this);
        webAudioModel.removeEventListener("NodeParamDisconnected" /* ModelEvents.NODE_PARAM_DISCONNECTED */, this.nodeParamDisconnected, this);
    }
    contextCreated(event) {
        const context = event.data;
        this.graphManager.createContext(context.contextId);
        this.contextSelector.contextCreated(event);
    }
    contextDestroyed(event) {
        const contextId = event.data;
        this.graphManager.destroyContext(contextId);
        this.contextSelector.contextDestroyed(event);
    }
    contextChanged(event) {
        const context = event.data;
        if (!this.graphManager.hasContext(context.contextId)) {
            return;
        }
        this.contextSelector.contextChanged(event);
    }
    reset() {
        if (this.landingPage.isShowing()) {
            this.landingPage.detach();
        }
        this.contextSelector.reset();
        this.detailViewContainer.removeChildren();
        this.landingPage.show(this.detailViewContainer);
        this.graphManager.clearGraphs();
    }
    suspendModel() {
        this.graphManager.clearGraphs();
    }
    audioListenerCreated(event) {
        const listener = event.data;
        const graph = this.graphManager.getGraph(listener.contextId);
        if (!graph) {
            return;
        }
        graph.addNode({
            nodeId: listener.listenerId,
            nodeType: 'Listener',
            numberOfInputs: 0,
            numberOfOutputs: 0,
        });
    }
    audioListenerWillBeDestroyed(event) {
        const { contextId, listenerId } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        graph.removeNode(listenerId);
    }
    audioNodeCreated(event) {
        const node = event.data;
        const graph = this.graphManager.getGraph(node.contextId);
        if (!graph) {
            return;
        }
        graph.addNode({
            nodeId: node.nodeId,
            nodeType: node.nodeType,
            numberOfInputs: node.numberOfInputs,
            numberOfOutputs: node.numberOfOutputs,
        });
    }
    audioNodeWillBeDestroyed(event) {
        const { contextId, nodeId } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        graph.removeNode(nodeId);
    }
    audioParamCreated(event) {
        const param = event.data;
        const graph = this.graphManager.getGraph(param.contextId);
        if (!graph) {
            return;
        }
        graph.addParam({
            paramId: param.paramId,
            paramType: param.paramType,
            nodeId: param.nodeId,
        });
    }
    audioParamWillBeDestroyed(event) {
        const { contextId, paramId } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        graph.removeParam(paramId);
    }
    nodesConnected(event) {
        const { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        graph.addNodeToNodeConnection({
            sourceId,
            destinationId,
            sourceOutputIndex,
            destinationInputIndex,
        });
    }
    nodesDisconnected(event) {
        const { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        graph.removeNodeToNodeConnection({
            sourceId,
            destinationId,
            sourceOutputIndex,
            destinationInputIndex,
        });
    }
    nodeParamConnected(event) {
        const { contextId, sourceId, destinationId, sourceOutputIndex } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        // Since the destinationId is AudioParamId, we need to find the nodeId as the
        // real destinationId.
        const nodeId = graph.getNodeIdByParamId(destinationId);
        if (!nodeId) {
            return;
        }
        graph.addNodeToParamConnection({
            sourceId,
            destinationId: nodeId,
            sourceOutputIndex,
            destinationParamId: destinationId,
        });
    }
    nodeParamDisconnected(event) {
        const { contextId, sourceId, destinationId, sourceOutputIndex } = event.data;
        const graph = this.graphManager.getGraph(contextId);
        if (!graph) {
            return;
        }
        // Since the destinationId is AudioParamId, we need to find the nodeId as the
        // real destinationId.
        const nodeId = graph.getNodeIdByParamId(destinationId);
        if (!nodeId) {
            return;
        }
        graph.removeNodeToParamConnection({
            sourceId,
            destinationId: nodeId,
            sourceOutputIndex,
            destinationParamId: destinationId,
        });
    }
    updateDetailView(context) {
        if (this.landingPage.isShowing()) {
            this.landingPage.detach();
        }
        const detailBuilder = new ContextDetailBuilder(context);
        this.detailViewContainer.removeChildren();
        this.detailViewContainer.appendChild(detailBuilder.getFragment());
    }
    updateSummaryBar(contextId, contextRealtimeData) {
        const summaryBuilder = new ContextSummaryBuilder(contextId, contextRealtimeData);
        this.summaryBarContainer.removeChildren();
        this.summaryBarContainer.appendChild(summaryBuilder.getFragment());
    }
    clearSummaryBar() {
        this.summaryBarContainer.removeChildren();
    }
    async pollRealtimeData() {
        const context = this.contextSelector.selectedContext();
        if (!context) {
            this.clearSummaryBar();
            return;
        }
        for (const model of SDK.TargetManager.TargetManager.instance().models(WebAudioModel)) {
            // Display summary only for real-time context.
            if (context.contextType === 'realtime') {
                if (!this.graphManager.hasContext(context.contextId)) {
                    continue;
                }
                const realtimeData = await model.requestRealtimeData(context.contextId);
                if (realtimeData) {
                    this.updateSummaryBar(context.contextId, realtimeData);
                }
            }
            else {
                this.clearSummaryBar();
            }
        }
    }
}
//# sourceMappingURL=WebAudioView.js.map