import * as SharedObject from './SharedObject.js';
declare let isDebugBuild: boolean;
declare const DEVTOOLS_RECORDER_WORLD_NAME = "devtools_recorder";
declare class InjectedScript {
    #private;
    static get(): Promise<string>;
}
export { isDebugBuild, InjectedScript, DEVTOOLS_RECORDER_WORLD_NAME, SharedObject };
