import * as UI from '../../ui/legacy/legacy.js';
import type { LighthouseController } from './LighthouseController.js';
export declare class StartView extends UI.Widget.Widget {
    private controller;
    private readonly settingsToolbarInternal;
    private startButton;
    private helpText?;
    private warningText?;
    private shouldConfirm?;
    constructor(controller: LighthouseController);
    settingsToolbar(): UI.Toolbar.Toolbar;
    private populateRuntimeSettingAsRadio;
    private populateRuntimeSettingAsToolbarCheckbox;
    private populateFormControls;
    private render;
    onResize(): void;
    focusStartButton(): void;
    setStartButtonEnabled(isEnabled: boolean): void;
    setUnauditableExplanation(text: string | null): void;
    setWarningText(text: string | null): void;
    wasShown(): void;
}
