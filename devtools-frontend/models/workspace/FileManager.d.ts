import * as Common from '../../core/common/common.js';
interface SaveCallbackParam {
    fileSystemPath?: string;
}
export declare class FileManager extends Common.ObjectWrapper.ObjectWrapper<EventTypes> {
    private readonly saveCallbacks;
    private constructor();
    static instance(opts?: {
        forceNew: boolean | null;
    }): FileManager;
    save(url: string, content: string, forceSaveAs: boolean): Promise<SaveCallbackParam | null>;
    private savedURL;
    private canceledSavedURL;
    append(url: string, content: string): void;
    close(url: string): void;
    private appendedToURL;
}
export declare enum Events {
    AppendedToURL = "AppendedToURL"
}
export declare type EventTypes = {
    [Events.AppendedToURL]: string;
};
export {};
