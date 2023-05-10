import * as Common from '../common/common.js';
import type { FrameAssociated } from './FrameAssociated.js';
import type { Target } from './Target.js';
import type { SourceMap } from './SourceMap.js';
export declare class SourceMapManager<T extends FrameAssociated> extends Common.ObjectWrapper.ObjectWrapper<EventTypes<T>> {
    #private;
    constructor(target: Target);
    setEnabled(isEnabled: boolean): void;
    private inspectedURLChanged;
    sourceMapForClient(client: T): SourceMap | null;
    clientsForSourceMap(sourceMap: SourceMap): T[];
    private getSourceMapId;
    private resolveRelativeURLs;
    attachSourceMap(client: T, relativeSourceURL: string | undefined, relativeSourceMapURL: string | undefined): void;
    detachSourceMap(client: T): void;
    private sourceMapLoadedForTest;
    dispose(): void;
}
export declare enum Events {
    SourceMapWillAttach = "SourceMapWillAttach",
    SourceMapFailedToAttach = "SourceMapFailedToAttach",
    SourceMapAttached = "SourceMapAttached",
    SourceMapDetached = "SourceMapDetached"
}
export declare type EventTypes<T extends FrameAssociated> = {
    [Events.SourceMapWillAttach]: {
        client: T;
    };
    [Events.SourceMapFailedToAttach]: {
        client: T;
    };
    [Events.SourceMapAttached]: {
        client: T;
        sourceMap: SourceMap;
    };
    [Events.SourceMapDetached]: {
        client: T;
        sourceMap: SourceMap;
    };
};
