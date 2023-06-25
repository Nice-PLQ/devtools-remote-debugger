import type * as Converters from '../converters/converters.js';
import * as Models from '../models/models.js';
declare global {
    interface HTMLElementTagNameMap {
        'devtools-step-view': StepView;
    }
}
export declare const enum State {
    Default = "default",
    Success = "success",
    Current = "current",
    Outstanding = "outstanding",
    Error = "error",
    Stopped = "stopped"
}
export interface StepViewData {
    state: State;
    step?: Models.Schema.Step;
    section?: Models.Section.Section;
    error?: Error;
    hasBreakpoint: boolean;
    isEndOfGroup: boolean;
    isStartOfGroup: boolean;
    isFirstSection: boolean;
    isLastSection: boolean;
    stepIndex: number;
    sectionIndex: number;
    isRecording: boolean;
    isPlaying: boolean;
    removable: boolean;
    builtInConverters: Converters.Converter.Converter[];
    extensionConverters: Converters.Converter.Converter[];
    isSelected: boolean;
    recorderSettings: Models.RecorderSettings.RecorderSettings;
}
export declare class CaptureSelectorsEvent extends Event {
    static readonly eventName = "captureselectors";
    data: Models.Schema.StepWithSelectors & Partial<Models.Schema.ClickAttributes>;
    constructor(step: Models.Schema.StepWithSelectors & Partial<Models.Schema.ClickAttributes>);
}
export declare class StopSelectorsCaptureEvent extends Event {
    static readonly eventName = "stopselectorscapture";
    constructor();
}
export declare class CopyStepEvent extends Event {
    static readonly eventName = "copystep";
    step: Models.Schema.Step;
    constructor(step: Models.Schema.Step);
}
export declare class StepChanged extends Event {
    static readonly eventName = "stepchanged";
    currentStep: Models.Schema.Step;
    newStep: Models.Schema.Step;
    constructor(currentStep: Models.Schema.Step, newStep: Models.Schema.Step);
}
export declare const enum AddStepPosition {
    BEFORE = "before",
    AFTER = "after"
}
export declare class AddStep extends Event {
    static readonly eventName = "addstep";
    position: AddStepPosition;
    stepOrSection: Models.Schema.Step | Models.Section.Section;
    constructor(stepOrSection: Models.Schema.Step | Models.Section.Section, position: AddStepPosition);
}
export declare class RemoveStep extends Event {
    static readonly eventName = "removestep";
    step: Models.Schema.Step;
    constructor(step: Models.Schema.Step);
}
export declare class AddBreakpointEvent extends Event {
    static readonly eventName = "addbreakpoint";
    index: number;
    constructor(index: number);
}
export declare class RemoveBreakpointEvent extends Event {
    static readonly eventName = "removebreakpoint";
    index: number;
    constructor(index: number);
}
export declare class StepView extends HTMLElement {
    #private;
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    set data(data: StepViewData);
    get step(): Models.Schema.Step | undefined;
    get section(): Models.Section.Section | undefined;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
