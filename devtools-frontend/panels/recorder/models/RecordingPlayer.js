// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../../core/sdk/sdk.js';
import * as Common from '../../../core/common/common.js';
import * as PuppeteerService from '../../../services/puppeteer/puppeteer.js';
import * as PuppeteerReplay from '../../../third_party/puppeteer-replay/puppeteer-replay.js';
const speedDelayMap = {
    ["normal" /* PlayRecordingSpeed.Normal */]: 0,
    ["slow" /* PlayRecordingSpeed.Slow */]: 500,
    ["very_slow" /* PlayRecordingSpeed.VerySlow */]: 1000,
    ["extremely_slow" /* PlayRecordingSpeed.ExtremelySlow */]: 2000,
};
export const defaultTimeout = 5000; // ms
export function shouldAttachToTarget(mainTargetId, targetInfo) {
    // Ignore chrome extensions as we don't support them. This includes DevTools extensions.
    if (targetInfo.url.startsWith('chrome-extension://')) {
        return false;
    }
    // Allow DevTools-on-DevTools replay.
    if (targetInfo.url.startsWith('devtools://') && targetInfo.targetId === mainTargetId) {
        return true;
    }
    if (targetInfo.type !== 'page' && targetInfo.type !== 'iframe') {
        return false;
    }
    // TODO only connect to iframes that are related to the main target. This requires refactoring in Puppeteer: https://github.com/puppeteer/puppeteer/issues/3667.
    return (targetInfo.targetId === mainTargetId || targetInfo.openerId === mainTargetId || targetInfo.type === 'iframe');
}
function isPageTarget(target) {
    // Treat DevTools targets as page targets too.
    return (target.url.startsWith('devtools://') || target.type === 'page' || target.type === 'background_page' ||
        target.type === 'webview');
}
export class RecordingPlayer extends Common.ObjectWrapper.ObjectWrapper {
    #stopPromise;
    #resolveStopPromise;
    userFlow;
    speed;
    timeout;
    breakpointIndexes;
    steppingOver = false;
    aborted = false;
    abortPromise;
    #abortResolveFn;
    #runner;
    constructor(userFlow, { speed, breakpointIndexes = new Set(), }) {
        super();
        this.userFlow = userFlow;
        this.speed = speed;
        this.timeout = userFlow.timeout || defaultTimeout;
        this.breakpointIndexes = breakpointIndexes;
        this.#stopPromise = new Promise(resolve => {
            this.#resolveStopPromise = resolve;
        });
        this.abortPromise = new Promise(resolve => {
            this.#abortResolveFn = resolve;
        });
    }
    #resolveAndRefreshStopPromise() {
        this.#resolveStopPromise?.();
        this.#stopPromise = new Promise(resolve => {
            this.#resolveStopPromise = resolve;
        });
    }
    static async connectPuppeteer() {
        const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
        if (!mainTarget) {
            throw new Error('Could not find main target');
        }
        const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
        if (!childTargetManager) {
            throw new Error('Could not get childTargetManager');
        }
        const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
        if (!resourceTreeModel) {
            throw new Error('Could not get resource tree model');
        }
        const mainFrame = resourceTreeModel.mainFrame;
        if (!mainFrame) {
            throw new Error('Could not find main frame');
        }
        // Pass an empty message handler because it will be overwritten by puppeteer anyways.
        const result = await childTargetManager.createParallelConnection(() => { });
        const connection = result.connection;
        const mainTargetId = await childTargetManager.getParentTargetId();
        const { page, browser, puppeteerConnection } = await PuppeteerService.PuppeteerConnection.PuppeteerConnectionHelper.connectPuppeteerToConnection({
            connection,
            mainFrameId: mainFrame.id,
            targetInfos: childTargetManager.targetInfos(),
            targetFilterCallback: shouldAttachToTarget.bind(null, mainTargetId),
            isPageTargetCallback: isPageTarget,
        });
        if (!page) {
            throw new Error('could not find main page!');
        }
        browser.on('targetdiscovered', (targetInfo) => {
            // Pop-ups opened by the main target won't be auto-attached. Therefore,
            // we need to create a session for them explicitly. We user openedId
            // and type to classify a target as requiring a session.
            if (targetInfo.type !== 'page') {
                return;
            }
            if (targetInfo.targetId === mainTargetId) {
                return;
            }
            if (targetInfo.openerId !== mainTargetId) {
                return;
            }
            void puppeteerConnection._createSession(targetInfo, 
            /* emulateAutoAttach= */ true);
        });
        return { page, browser };
    }
    static async disconnectPuppeteer(browser) {
        try {
            const pages = await browser.pages();
            for (const page of pages) {
                const client = page._client();
                await client.send('Network.disable');
                await client.send('Page.disable');
                await client.send('Log.disable');
                await client.send('Performance.disable');
                await client.send('Runtime.disable');
                await client.send('Emulation.clearDeviceMetricsOverride');
                await client.send('Emulation.setAutomationOverride', { enabled: false });
                for (const frame of page.frames()) {
                    const client = frame._client();
                    await client.send('Network.disable');
                    await client.send('Page.disable');
                    await client.send('Log.disable');
                    await client.send('Performance.disable');
                    await client.send('Runtime.disable');
                    await client.send('Emulation.setAutomationOverride', { enabled: false });
                }
            }
            browser.disconnect();
        }
        catch (err) {
            console.error('Error disconnecting Puppeteer', err.message);
        }
    }
    async stop() {
        await Promise.race([this.#stopPromise, this.abortPromise]);
    }
    abort() {
        this.aborted = true;
        this.#abortResolveFn?.();
        this.#runner?.abort();
    }
    disposeForTesting() {
        this.#resolveStopPromise?.();
        this.#abortResolveFn?.();
    }
    continue() {
        this.steppingOver = false;
        this.#resolveAndRefreshStopPromise();
    }
    stepOver() {
        this.steppingOver = true;
        this.#resolveAndRefreshStopPromise();
    }
    updateBreakpointIndexes(breakpointIndexes) {
        this.breakpointIndexes = breakpointIndexes;
    }
    async play() {
        const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
        if (mainTarget) {
            await mainTarget.pageAgent().invoke_setPrerenderingAllowed({
                isAllowed: false,
            });
        }
        const { page, browser } = await RecordingPlayer.connectPuppeteer();
        this.aborted = false;
        const player = this;
        class ExtensionWithBreak extends PuppeteerReplay.PuppeteerRunnerExtension {
            #speed;
            constructor(browser, page, { timeout, speed, }) {
                super(browser, page, { timeout });
                this.#speed = speed;
            }
            async beforeEachStep(step, flow) {
                let resolver = () => { };
                const promise = new Promise(r => {
                    resolver = r;
                });
                player.dispatchEventToListeners("Step" /* Events.Step */, {
                    step,
                    resolve: resolver,
                });
                await promise;
                const currentStepIndex = flow.steps.indexOf(step);
                const shouldStopAtCurrentStep = player.steppingOver || player.breakpointIndexes.has(currentStepIndex);
                const shouldWaitForSpeed = step.type !== 'setViewport' && step.type !== 'navigate' && !player.aborted;
                if (shouldStopAtCurrentStep) {
                    player.dispatchEventToListeners("Stop" /* Events.Stop */);
                    await player.stop();
                    player.dispatchEventToListeners("Continue" /* Events.Continue */);
                }
                else if (shouldWaitForSpeed) {
                    await Promise.race([
                        new Promise(resolve => setTimeout(resolve, speedDelayMap[this.#speed])),
                        player.abortPromise,
                    ]);
                }
            }
            async runStep(step, flow) {
                // When replaying on a DevTools target we skip setViewport and navigate steps
                // because navigation and viewport changes are not supported there.
                if (page?.url().startsWith('devtools://') && (step.type === 'setViewport' || step.type === 'navigate')) {
                    return;
                }
                return await super.runStep(step, flow);
            }
        }
        const extension = new ExtensionWithBreak(browser, page, {
            timeout: this.timeout,
            speed: this.speed,
        });
        this.#runner = await PuppeteerReplay.createRunner(this.userFlow, extension);
        let error;
        try {
            await this.#runner.run();
        }
        catch (err) {
            error = err;
            console.error('Replay error', err.message);
        }
        finally {
            const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
            if (mainTarget) {
                await mainTarget.pageAgent().invoke_setPrerenderingAllowed({
                    isAllowed: true,
                });
            }
            await RecordingPlayer.disconnectPuppeteer(browser);
        }
        if (this.aborted) {
            this.dispatchEventToListeners("Abort" /* Events.Abort */);
        }
        else if (error) {
            this.dispatchEventToListeners("Error" /* Events.Error */, error);
        }
        else {
            this.dispatchEventToListeners("Done" /* Events.Done */);
        }
    }
}
//# sourceMappingURL=RecordingPlayer.js.map