import * as UI from '../../ui/legacy/legacy.js';
export declare class WebauthnPaneImpl extends UI.Widget.VBox {
    private enabled;
    private activeAuthId;
    private hasBeenEnabled;
    private readonly dataGrids;
    private enableCheckbox;
    private readonly availableAuthenticatorSetting;
    private model;
    private authenticatorsView;
    private topToolbarContainer;
    private topToolbar;
    private learnMoreView;
    private newAuthenticatorSection;
    private newAuthenticatorForm;
    private protocolSelect;
    private transportSelect;
    private residentKeyCheckboxLabel;
    private residentKeyCheckbox;
    private userVerificationCheckboxLabel;
    private userVerificationCheckbox;
    private addAuthenticatorButton;
    private isEnabling?;
    constructor();
    static instance(opts?: {
        forceNew: null;
    }): WebauthnPaneImpl;
    private loadInitialAuthenticators;
    ownerViewDisposed(): Promise<void>;
    private createToolbar;
    private createCredentialsDataGrid;
    private handleExportCredential;
    private handleRemoveCredential;
    private updateCredentials;
    private maybeAddEmptyNode;
    private setVirtualAuthEnvEnabled;
    private updateVisibility;
    private removeAuthenticatorSections;
    private handleCheckboxToggle;
    private updateEnabledTransportOptions;
    private updateNewAuthenticatorSectionOptions;
    private createNewAuthenticatorSection;
    private handleAddAuthenticatorButton;
    private addAuthenticatorSection;
    private exportCredential;
    private removeCredential;
    /**
     * Creates the fields describing the authenticator in the front end.
     */
    private createAuthenticatorFields;
    private handleEditNameButton;
    private handleSaveNameButton;
    private updateActiveLabelTitle;
    /**
     * Removes both the authenticator and its respective UI element.
     */
    private removeAuthenticator;
    private createOptionsFromCurrentInputs;
    /**
     * Sets the given authenticator as active.
     * Note that a newly added authenticator will automatically be set as active.
     */
    private setActiveAuthenticator;
    private updateActiveButtons;
    private clearActiveAuthenticator;
    wasShown(): void;
}
