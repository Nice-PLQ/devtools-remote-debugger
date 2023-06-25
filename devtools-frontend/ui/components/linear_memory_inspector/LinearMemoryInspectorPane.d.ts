import * as Common from '../../../core/common/common.js';
import * as UI from '../../legacy/legacy.js';
import { type Settings } from './LinearMemoryInspector.js';
import { type LazyUint8Array } from './LinearMemoryInspectorController.js';
export declare class Wrapper extends UI.Widget.VBox {
    view: LinearMemoryInspectorPaneImpl;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): Wrapper;
    wasShown(): void;
}
declare const LinearMemoryInspectorPaneImpl_base: (new (...args: any[]) => {
    "__#13@#events": Common.ObjectWrapper.ObjectWrapper<EventTypes>;
    addEventListener<T extends Events.ViewClosed>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T], any>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<EventTypes, T>;
    once<T_1 extends Events.ViewClosed>(eventType: T_1): Promise<EventTypes[T_1]>;
    removeEventListener<T_2 extends Events.ViewClosed>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T_2], any>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: Events.ViewClosed): boolean;
    dispatchEventToListeners<T_3 extends Events.ViewClosed>(eventType: import("../../../core/platform/typescript-utilities.js").NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<EventTypes, T_3>): void;
}) & typeof UI.Widget.VBox;
export declare class LinearMemoryInspectorPaneImpl extends LinearMemoryInspectorPaneImpl_base {
    #private;
    constructor();
    static instance(): LinearMemoryInspectorPaneImpl;
    getViewForTabId(tabId: string): LinearMemoryInspectorView;
    create(tabId: string, title: string, arrayWrapper: LazyUint8Array, address?: number): void;
    close(tabId: string): void;
    reveal(tabId: string, address?: number): void;
    refreshView(tabId: string): void;
}
export declare const enum Events {
    ViewClosed = "ViewClosed"
}
export type EventTypes = {
    [Events.ViewClosed]: string;
};
declare class LinearMemoryInspectorView extends UI.Widget.VBox {
    #private;
    firstTimeOpen: boolean;
    constructor(memoryWrapper: LazyUint8Array, address: number | undefined, tabId: string);
    wasShown(): void;
    saveSettings(settings: Settings): void;
    updateAddress(address: number): void;
    refreshData(): void;
}
export {};
