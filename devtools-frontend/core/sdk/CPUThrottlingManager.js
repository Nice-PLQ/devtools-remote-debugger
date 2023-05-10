// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
import { EmulationModel } from './EmulationModel.js';
import { TargetManager } from './TargetManager.js';
let throttlingManagerInstance;
export class CPUThrottlingManager extends Common.ObjectWrapper.ObjectWrapper {
    #cpuThrottlingRateInternal;
    constructor() {
        super();
        this.#cpuThrottlingRateInternal = CPUThrottlingRates.NoThrottling;
        TargetManager.instance().observeModels(EmulationModel, this);
    }
    static instance(opts = { forceNew: null }) {
        const { forceNew } = opts;
        if (!throttlingManagerInstance || forceNew) {
            throttlingManagerInstance = new CPUThrottlingManager();
        }
        return throttlingManagerInstance;
    }
    cpuThrottlingRate() {
        return this.#cpuThrottlingRateInternal;
    }
    setCPUThrottlingRate(rate) {
        this.#cpuThrottlingRateInternal = rate;
        for (const emulationModel of TargetManager.instance().models(EmulationModel)) {
            emulationModel.setCPUThrottlingRate(this.#cpuThrottlingRateInternal);
        }
        this.dispatchEventToListeners(Events.RateChanged, this.#cpuThrottlingRateInternal);
    }
    modelAdded(emulationModel) {
        if (this.#cpuThrottlingRateInternal !== CPUThrottlingRates.NoThrottling) {
            emulationModel.setCPUThrottlingRate(this.#cpuThrottlingRateInternal);
        }
    }
    modelRemoved(_emulationModel) {
        // Implemented as a requirement for being a SDKModelObserver.
    }
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var Events;
(function (Events) {
    Events["RateChanged"] = "RateChanged";
})(Events || (Events = {}));
export function throttlingManager() {
    return CPUThrottlingManager.instance();
}
// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export var CPUThrottlingRates;
(function (CPUThrottlingRates) {
    CPUThrottlingRates[CPUThrottlingRates["NoThrottling"] = 1] = "NoThrottling";
    CPUThrottlingRates[CPUThrottlingRates["MidTierMobile"] = 4] = "MidTierMobile";
    CPUThrottlingRates[CPUThrottlingRates["LowEndMobile"] = 6] = "LowEndMobile";
})(CPUThrottlingRates || (CPUThrottlingRates = {}));
//# sourceMappingURL=CPUThrottlingManager.js.map