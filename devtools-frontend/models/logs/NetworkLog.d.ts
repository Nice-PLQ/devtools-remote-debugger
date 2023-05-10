import * as Common from '../../core/common/common.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as Protocol from '../../generated/protocol.js';
export declare class NetworkLog extends Common.ObjectWrapper.ObjectWrapper<EventTypes> implements SDK.TargetManager.SDKModelObserver<SDK.NetworkManager.NetworkManager> {
    private requestsInternal;
    private sentNetworkRequests;
    private receivedNetworkResponses;
    private requestsSet;
    private readonly requestsMap;
    private readonly pageLoadForManager;
    private isRecording;
    private readonly modelListeners;
    private readonly initiatorData;
    private readonly unresolvedPreflightRequests;
    constructor();
    static instance(): NetworkLog;
    modelAdded(networkManager: SDK.NetworkManager.NetworkManager): void;
    modelRemoved(networkManager: SDK.NetworkManager.NetworkManager): void;
    private removeNetworkManagerListeners;
    setIsRecording(enabled: boolean): void;
    requestForURL(url: string): SDK.NetworkRequest.NetworkRequest | null;
    originalRequestForURL(url: string): Protocol.Network.Request | null;
    originalResponseForURL(url: string): Protocol.Network.Response | null;
    requests(): SDK.NetworkRequest.NetworkRequest[];
    requestByManagerAndId(networkManager: SDK.NetworkManager.NetworkManager, requestId: string): SDK.NetworkRequest.NetworkRequest | null;
    private requestByManagerAndURL;
    private initializeInitiatorSymbolIfNeeded;
    initiatorInfoForRequest(request: SDK.NetworkRequest.NetworkRequest): InitiatorInfo;
    initiatorGraphForRequest(request: SDK.NetworkRequest.NetworkRequest): InitiatorGraph;
    private initiatorChain;
    private initiatorRequest;
    private willReloadPage;
    private onMainFrameNavigated;
    private addRequest;
    private tryResolvePreflightRequests;
    importRequests(requests: SDK.NetworkRequest.NetworkRequest[]): void;
    private onRequestStarted;
    private onResponseReceived;
    private onRequestUpdated;
    private onRequestRedirect;
    private onDOMContentLoaded;
    private onLoad;
    reset(clearIfPreserved: boolean): void;
    private networkMessageGenerated;
    associateConsoleMessageWithRequest(consoleMessage: SDK.ConsoleModel.ConsoleMessage, requestId: string): void;
    static requestForConsoleMessage(consoleMessage: SDK.ConsoleModel.ConsoleMessage): SDK.NetworkRequest.NetworkRequest | null;
    requestsForId(requestId: string): SDK.NetworkRequest.NetworkRequest[];
}
export declare enum Events {
    Reset = "Reset",
    RequestAdded = "RequestAdded",
    RequestUpdated = "RequestUpdated"
}
export interface ResetEvent {
    clearIfPreserved: boolean;
}
export declare type EventTypes = {
    [Events.Reset]: ResetEvent;
    [Events.RequestAdded]: SDK.NetworkRequest.NetworkRequest;
    [Events.RequestUpdated]: SDK.NetworkRequest.NetworkRequest;
};
export interface InitiatorGraph {
    initiators: Set<SDK.NetworkRequest.NetworkRequest>;
    initiated: Map<SDK.NetworkRequest.NetworkRequest, SDK.NetworkRequest.NetworkRequest>;
}
interface InitiatorInfo {
    type: SDK.NetworkRequest.InitiatorType;
    url: string;
    lineNumber: number;
    columnNumber: number;
    scriptId: Protocol.Runtime.ScriptId | null;
    stack: Protocol.Runtime.StackTrace | null;
    initiatorRequest: SDK.NetworkRequest.NetworkRequest | null;
}
export {};
