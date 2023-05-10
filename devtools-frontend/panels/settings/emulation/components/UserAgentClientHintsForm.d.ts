import type * as Protocol from '../../../../generated/protocol.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
export declare class ClientHintsChangeEvent extends Event {
    static readonly eventName = "clienthintschange";
    constructor();
}
export declare class ClientHintsSubmitEvent extends Event {
    static readonly eventName = "clienthintssubmit";
    detail: {
        value: Protocol.Emulation.UserAgentMetadata;
    };
    constructor(value: Protocol.Emulation.UserAgentMetadata);
}
export interface UserAgentClientHintsFormData {
    metaData?: Protocol.Emulation.UserAgentMetadata;
    showMobileCheckbox?: boolean;
    showSubmitButton?: boolean;
}
/**
 * Component for user agent client hints form, it is used in device settings panel
 * and network conditions panel. It is customizable through showMobileCheckbox and showSubmitButton.
 */
export declare class UserAgentClientHintsForm extends HTMLElement {
    static readonly litTagName: import("../../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private isFormOpened;
    private isFormDisabled;
    private metaData;
    private showMobileCheckbox;
    private showSubmitButton;
    private brandsModifiedAriaMessage;
    connectedCallback(): void;
    set value(data: UserAgentClientHintsFormData);
    get value(): UserAgentClientHintsFormData;
    set disabled(disableForm: boolean);
    get disabled(): boolean;
    private handleTreeExpand;
    private handleTreeClick;
    private handleBrandInputChange;
    private handleBrandDelete;
    private handleAddBrandClick;
    private handleAddBrandKeyPress;
    private handleInputChange;
    private handleLinkPress;
    private handleSubmit;
    private renderInputWithLabel;
    private renderPlatformSection;
    private renderDeviceModelSection;
    private renderBrands;
    private render;
    validate: () => UI.ListWidget.ValidatorResult;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-user-agent-client-hints-form': UserAgentClientHintsForm;
    }
}
