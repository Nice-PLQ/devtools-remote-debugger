import type * as Models from '../models/models.js';
import { PlayRecordingSpeed } from '../models/RecordingPlayer.js';
import type * as Extensions from '../extensions/extensions.js';
export declare class StartReplayEvent extends Event {
    speed: PlayRecordingSpeed;
    extension?: Extensions.ExtensionManager.Extension | undefined;
    static readonly eventName = "startreplay";
    constructor(speed: PlayRecordingSpeed, extension?: Extensions.ExtensionManager.Extension | undefined);
}
export interface ReplayButtonProps {
    disabled: boolean;
}
export interface ReplayButtonData {
    settings: Models.RecorderSettings.RecorderSettings;
    replayExtensions: Extensions.ExtensionManager.Extension[];
}
export declare class ReplayButton extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    set data(data: ReplayButtonData);
    get disabled(): boolean;
    set disabled(disabled: boolean);
    connectedCallback(): void;
}
declare global {
    interface HTMLElementEventMap {
        startreplay: StartReplayEvent;
    }
    interface HTMLElementTagNameMap {
        'devtools-replay-button': ReplayButton;
    }
}
