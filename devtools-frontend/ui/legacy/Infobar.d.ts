import type * as Common from '../../core/common/common.js';
import type { Widget } from './Widget.js';
export declare class Infobar {
    element: HTMLElement;
    private readonly shadowRoot;
    private readonly contentElement;
    private readonly mainRow;
    private readonly detailsRows;
    private hasDetails;
    private detailsMessage;
    private readonly infoContainer;
    private readonly infoMessage;
    private infoText;
    private readonly actionContainer;
    private readonly disableSetting;
    private readonly closeContainer;
    private readonly toggleElement;
    private readonly closeButton;
    private closeCallback;
    private parentView?;
    constructor(type: Type, text: string, actions?: InfobarAction[], disableSetting?: Common.Settings.Setting<any>);
    static create(type: Type, text: string, actions?: InfobarAction[], disableSetting?: Common.Settings.Setting<any>): Infobar | null;
    dispose(): void;
    setText(text: string): void;
    setCloseCallback(callback: (() => any) | null): void;
    setParentView(parentView: Widget): void;
    private actionCallbackFactory;
    private onResize;
    private onDisable;
    private onToggleDetails;
    createDetailsRowMessage(message?: string): Element;
}
export interface InfobarAction {
    text: string;
    highlight: boolean;
    delegate: (() => void) | null;
    dismiss: boolean;
}
export declare enum Type {
    Warning = "warning",
    Info = "info",
    Issue = "issue"
}
