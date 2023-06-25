import '../../recorder/components/components.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as LitHtml from '../../../ui/lit-html/lit-html.js';
declare const LitElement: typeof LitHtml.LitElement;
declare global {
    interface HTMLElementTagNameMap {
        'devtools-json-editor': JSONEditor;
    }
}
export interface Parameter {
    type: string;
    optional: boolean;
    value: string | undefined;
    name: string;
}
export interface Command {
    command: string;
    parameters: {
        [x: string]: unknown;
    };
    targetId?: string;
}
/**
 * Parents should listen for this event and register the listeners provided by
 * this event"
 */
export declare class SubmitEditorEvent extends Event {
    static readonly eventName = "submiteditor";
    readonly data: Command;
    constructor(data: Command);
}
export declare class JSONEditor extends LitElement {
    #private;
    static styles: CSSStyleSheet[];
    protocolMethodWithParametersMap: Map<string, Parameter[]>;
    targetManager: SDK.TargetManager.TargetManager;
    parameters: Record<string, Parameter>;
    command: string;
    targetId?: string;
    constructor();
    getParameters(): {
        [x: string]: unknown;
    };
    render(): LitHtml.TemplateResult;
}
export {};
