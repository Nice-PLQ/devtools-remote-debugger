import * as Common from '../../core/common/common.js';
export declare class JsMainImpl implements Common.Runnable.Runnable {
    static instance(opts?: {
        forceNew: boolean | null;
    }): JsMainImpl;
    run(): Promise<void>;
}
