import * as Common from '../../core/common/common.js';
import * as Platform from '../../core/platform/platform.js';
import * as DataGrid from '../../ui/components/data_grid/data_grid.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as Components from './components/components.js';
export declare const buildProtocolCommandsParametersMap: (domains: Iterable<ProtocolDomain>) => Map<string, Components.JSONEditor.Parameter[]>;
export declare const formatParameters: (parameters: {
    [x: string]: unknown;
}, command: string) => {
    [x: string]: Components.JSONEditor.Parameter;
};
export interface Message {
    id?: number;
    method: string;
    error: Object;
    result: Object;
    params: Object;
    sessionId?: string;
}
export interface LogMessage {
    id?: number;
    domain: string;
    method: string;
    params: Object;
    type: 'send' | 'recv';
}
export interface ProtocolDomain {
    readonly domain: string;
    readonly commandParameters: {
        [x: string]: Components.JSONEditor.Parameter[];
    };
}
export declare class ProtocolMonitorDataGrid extends UI.Widget.VBox {
    #private;
    private started;
    private startTime;
    private readonly requestTimeForId;
    private readonly dataGridRowForId;
    private readonly infoWidget;
    private readonly dataGridIntegrator;
    private readonly filterParser;
    private readonly suggestionBuilder;
    private readonly textFilterUI;
    private messages;
    private isRecording;
    constructor(splitWidget: UI.SplitWidget.SplitWidget);
    onCommandSend(command: string, parameters: object, target?: string): void;
    static instance(opts?: {
        forceNew: null | boolean;
    }): ProtocolMonitorImpl;
    wasShown(): void;
    private setRecording;
    private targetToString;
    private messageReceived;
    private messageSent;
    private saveAsFile;
}
export declare class ProtocolMonitorImpl extends UI.Widget.VBox {
    #private;
    constructor();
    static instance(opts?: {
        forceNew: null | boolean;
    }): ProtocolMonitorImpl;
}
export declare class CommandAutocompleteSuggestionProvider {
    #private;
    constructor(maxHistorySize?: number);
    buildTextPromptCompletions: (expression: string, prefix: string, force?: boolean) => Promise<UI.SuggestBox.Suggestions>;
    addEntry(value: string): void;
}
export declare class InfoWidget extends UI.Widget.VBox {
    private readonly tabbedPane;
    constructor();
    render(data: {
        request: DataGrid.DataGridUtils.Cell | undefined;
        response: DataGrid.DataGridUtils.Cell | undefined;
        type: 'sent' | 'received' | undefined;
    } | null): void;
}
export declare enum Events {
    CommandSent = "CommandSent"
}
export type EventTypes = {
    [Events.CommandSent]: Components.JSONEditor.Command;
};
declare const EditorWidget_base: (new (...args: any[]) => {
    "__#13@#events": Common.ObjectWrapper.ObjectWrapper<EventTypes>;
    addEventListener<T extends Events.CommandSent>(eventType: T, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T], any>) => void, thisObject?: Object | undefined): Common.EventTarget.EventDescriptor<EventTypes, T>;
    once<T_1 extends Events.CommandSent>(eventType: T_1): Promise<EventTypes[T_1]>;
    removeEventListener<T_2 extends Events.CommandSent>(eventType: T_2, listener: (arg0: Common.EventTarget.EventTargetEvent<EventTypes[T_2], any>) => void, thisObject?: Object | undefined): void;
    hasEventListeners(eventType: Events.CommandSent): boolean;
    dispatchEventToListeners<T_3 extends Events.CommandSent>(eventType: Platform.TypeScriptUtilities.NoUnion<T_3>, ...eventData: Common.EventTarget.EventPayloadToRestParameters<EventTypes, T_3>): void;
}) & typeof UI.Widget.VBox;
export declare class EditorWidget extends EditorWidget_base {
    readonly jsonEditor: Components.JSONEditor.JSONEditor;
    constructor();
    setCommand(command: string, parameters: {
        [x: string]: Components.JSONEditor.Parameter;
    }): void;
}
export declare function parseCommandInput(input: string): {
    command: string;
    parameters: {
        [x: string]: unknown;
    };
};
export {};
