import type * as SDK from '../../core/sdk/sdk.js';
import { TimelineController, type Client } from './TimelineController.js';
export declare class UIDevtoolsController extends TimelineController {
    constructor(target: SDK.Target.Target, client: Client);
}
