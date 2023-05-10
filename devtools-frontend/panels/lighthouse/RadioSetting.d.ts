import type * as Common from '../../core/common/common.js';
export declare class RadioSetting {
    private readonly setting;
    private options;
    element: HTMLDivElement;
    private radioElements;
    private ignoreChangeEvents;
    private selectedIndex;
    constructor(options: {
        value: string;
        label: () => Common.UIString.LocalizedString;
    }[], setting: Common.Settings.Setting<string>, description: string);
    private updateUI;
    private settingChanged;
    private valueChanged;
}
