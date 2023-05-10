import * as UI from '../../ui/legacy/legacy.js';
export declare class NodeConnectionsPanel extends UI.Panel.Panel {
    private config;
    private readonly networkDiscoveryView;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): NodeConnectionsPanel;
    private devicesDiscoveryConfigChanged;
    wasShown(): void;
}
export declare class NodeConnectionsView extends UI.Widget.VBox implements UI.ListWidget.Delegate<Adb.PortForwardingRule> {
    private readonly callback;
    private readonly list;
    private editor;
    private networkDiscoveryConfig;
    constructor(callback: (arg0: Adb.NetworkDiscoveryConfig) => void);
    private update;
    private addNetworkTargetButtonClicked;
    discoveryConfigChanged(networkDiscoveryConfig: Adb.NetworkDiscoveryConfig): void;
    renderItem(rule: Adb.PortForwardingRule, _editable: boolean): Element;
    removeItemRequested(rule: Adb.PortForwardingRule, index: number): void;
    commitEdit(rule: Adb.PortForwardingRule, editor: UI.ListWidget.Editor<Adb.PortForwardingRule>, isNew: boolean): void;
    beginEdit(rule: Adb.PortForwardingRule): UI.ListWidget.Editor<Adb.PortForwardingRule>;
    private createEditor;
    wasShown(): void;
}
