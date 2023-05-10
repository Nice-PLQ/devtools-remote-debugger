import * as SDK from '../../../../core/sdk/sdk.js';
import * as Bindings from '../../../../models/bindings/bindings.js';
import * as Workspace from '../../../../models/workspace/workspace.js';
import * as SourceFrame from '../source_frame/source_frame.js';
import type * as Protocol from '../../../../generated/protocol.js';
export declare class Performance {
    private readonly helper;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): Performance;
    reset(): void;
    private appendLegacyCPUProfile;
    appendCPUProfile(profile: SDK.CPUProfileDataModel.CPUProfileDataModel): void;
}
export declare class Memory {
    private readonly helper;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): Memory;
    reset(): void;
    appendHeapProfile(profile: Protocol.HeapProfiler.SamplingHeapProfile, target: SDK.Target.Target | null): void;
}
export declare class Helper {
    private readonly type;
    private readonly locationPool;
    private updateTimer;
    private lineData;
    constructor(type: string);
    reset(): void;
    addLineData(target: SDK.Target.Target | null, scriptIdOrUrl: string | number, line: number, data: number): void;
    scheduleUpdate(): void;
    private doUpdate;
}
export declare class Presentation {
    private readonly type;
    private readonly time;
    private uiLocation;
    constructor(rawLocation: SDK.DebuggerModel.Location, type: string, time: number, locationPool: Bindings.LiveLocation.LiveLocationPool);
    updateLocation(liveLocation: Bindings.LiveLocation.LiveLocation): Promise<void>;
}
export declare class LineDecorator implements SourceFrame.SourceFrame.LineDecorator {
    static instance(opts?: {
        forceNew: boolean | null;
    }): LineDecorator;
    decorate(uiSourceCode: Workspace.UISourceCode.UISourceCode, textEditor: SourceFrame.SourcesTextEditor.SourcesTextEditor, type: string): void;
    private createElement;
}
