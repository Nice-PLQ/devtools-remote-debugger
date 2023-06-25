import * as SDK from '../../../core/sdk/sdk.js';
import { type Settings } from './LinearMemoryInspector.js';
import * as Bindings from '../../../models/bindings/bindings.js';
import { type HighlightInfo } from './LinearMemoryViewerUtils.js';
export declare const ACCEPTED_MEMORY_TYPES: string[];
export interface LazyUint8Array {
    getRange(start: number, end: number): Promise<Uint8Array>;
    length(): number;
}
export declare class RemoteArrayBufferWrapper implements LazyUint8Array {
    #private;
    constructor(arrayBuffer: SDK.RemoteObject.RemoteArrayBuffer);
    length(): number;
    getRange(start: number, end: number): Promise<Uint8Array>;
}
export declare function isDWARFMemoryObject(obj: SDK.RemoteObject.RemoteObject): boolean;
export declare function isMemoryObjectProperty(obj: SDK.RemoteObject.RemoteObject): boolean;
export declare class LinearMemoryInspectorController extends SDK.TargetManager.SDKModelObserver<SDK.RuntimeModel.RuntimeModel> {
    #private;
    private constructor();
    static instance(): LinearMemoryInspectorController;
    static getMemoryForAddress(memoryWrapper: LazyUint8Array, address: number): Promise<{
        memory: Uint8Array;
        offset: number;
    }>;
    static getMemoryRange(memoryWrapper: LazyUint8Array, start: number, end: number): Promise<Uint8Array>;
    evaluateExpression(callFrame: SDK.DebuggerModel.CallFrame, expressionName: string): Promise<SDK.RemoteObject.RemoteObject | undefined>;
    saveSettings(data: Settings): void;
    loadSettings(): Settings;
    getHighlightInfo(bufferId: string): HighlightInfo | undefined;
    removeHighlight(bufferId: string, highlightInfo: HighlightInfo): void;
    setHighlightInfo(bufferId: string, highlightInfo: HighlightInfo): void;
    static retrieveDWARFMemoryObjectAndAddress(obj: SDK.RemoteObject.RemoteObject): Promise<{
        obj: SDK.RemoteObject.RemoteObject;
        address: number;
    } | undefined>;
    static extractObjectSize(obj: Bindings.DebuggerLanguagePlugins.ExtensionRemoteObject): number;
    static extractObjectTypeDescription(obj: SDK.RemoteObject.RemoteObject): string;
    static extractObjectName(obj: SDK.RemoteObject.RemoteObject, expression: string): string;
    openInspectorView(obj: SDK.RemoteObject.RemoteObject, address?: number, expression?: string): Promise<void>;
    static extractHighlightInfo(obj: SDK.RemoteObject.RemoteObject, expression?: string): HighlightInfo | undefined;
    modelRemoved(model: SDK.RuntimeModel.RuntimeModel): void;
    updateHighlightedMemory(bufferId: string, callFrame: SDK.DebuggerModel.CallFrame): Promise<void>;
}
