// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../common/common.js';
import * as Root from '../root/root.js';
import { InspectorFrontendHostInstance } from './InspectorFrontendHost.js';
import { bindOutputStream } from './ResourceLoader.js';
export var Role;
(function (Role) {
    /** Provide this role when giving a function call response  */
    Role[Role["ROLE_UNSPECIFIED"] = 0] = "ROLE_UNSPECIFIED";
    /** Tags the content came from the user */
    Role[Role["USER"] = 1] = "USER";
    /** Tags the content came from the LLM */
    Role[Role["MODEL"] = 2] = "MODEL";
})(Role || (Role = {}));
export var FunctionalityType;
(function (FunctionalityType) {
    // Unspecified functionality type.
    FunctionalityType[FunctionalityType["FUNCTIONALITY_TYPE_UNSPECIFIED"] = 0] = "FUNCTIONALITY_TYPE_UNSPECIFIED";
    // The generic AI chatbot functionality.
    FunctionalityType[FunctionalityType["CHAT"] = 1] = "CHAT";
    // The explain error functionality.
    FunctionalityType[FunctionalityType["EXPLAIN_ERROR"] = 2] = "EXPLAIN_ERROR";
    FunctionalityType[FunctionalityType["AGENTIC_CHAT"] = 5] = "AGENTIC_CHAT";
})(FunctionalityType || (FunctionalityType = {}));
export var ClientFeature;
(function (ClientFeature) {
    // Unspecified client feature.
    ClientFeature[ClientFeature["CLIENT_FEATURE_UNSPECIFIED"] = 0] = "CLIENT_FEATURE_UNSPECIFIED";
    // Chrome console insights feature.
    ClientFeature[ClientFeature["CHROME_CONSOLE_INSIGHTS"] = 1] = "CHROME_CONSOLE_INSIGHTS";
    // Chrome AI Assistance Styling Agent.
    ClientFeature[ClientFeature["CHROME_STYLING_AGENT"] = 2] = "CHROME_STYLING_AGENT";
    // Chrome AI Assistance Network Agent.
    ClientFeature[ClientFeature["CHROME_NETWORK_AGENT"] = 7] = "CHROME_NETWORK_AGENT";
    // Chrome AI Assistance Performance Agent.
    ClientFeature[ClientFeature["CHROME_PERFORMANCE_AGENT"] = 8] = "CHROME_PERFORMANCE_AGENT";
    // Chrome AI Assistance File Agent.
    ClientFeature[ClientFeature["CHROME_FILE_AGENT"] = 9] = "CHROME_FILE_AGENT";
    // Chrome AI Patch Agent.
    ClientFeature[ClientFeature["CHROME_PATCH_AGENT"] = 12] = "CHROME_PATCH_AGENT";
    // Chrome AI Assistance Performance Insights Agent.
    ClientFeature[ClientFeature["CHROME_PERFORMANCE_INSIGHTS_AGENT"] = 14] = "CHROME_PERFORMANCE_INSIGHTS_AGENT";
})(ClientFeature || (ClientFeature = {}));
export var UserTier;
(function (UserTier) {
    // Unspecified user tier.
    UserTier[UserTier["USER_TIER_UNSPECIFIED"] = 0] = "USER_TIER_UNSPECIFIED";
    // Users who are internal testers.
    UserTier[UserTier["TESTERS"] = 1] = "TESTERS";
    // Users who are early adopters.
    UserTier[UserTier["BETA"] = 2] = "BETA";
    // Users in the general public.
    UserTier[UserTier["PUBLIC"] = 3] = "PUBLIC";
})(UserTier || (UserTier = {}));
export var RecitationAction;
(function (RecitationAction) {
    RecitationAction["ACTION_UNSPECIFIED"] = "ACTION_UNSPECIFIED";
    RecitationAction["CITE"] = "CITE";
    RecitationAction["BLOCK"] = "BLOCK";
    RecitationAction["NO_ACTION"] = "NO_ACTION";
    RecitationAction["EXEMPT_FOUND_IN_PROMPT"] = "EXEMPT_FOUND_IN_PROMPT";
})(RecitationAction || (RecitationAction = {}));
export var CitationSourceType;
(function (CitationSourceType) {
    CitationSourceType["CITATION_SOURCE_TYPE_UNSPECIFIED"] = "CITATION_SOURCE_TYPE_UNSPECIFIED";
    CitationSourceType["TRAINING_DATA"] = "TRAINING_DATA";
    CitationSourceType["WORLD_FACTS"] = "WORLD_FACTS";
    CitationSourceType["LOCAL_FACTS"] = "LOCAL_FACTS";
    CitationSourceType["INDIRECT"] = "INDERECT";
})(CitationSourceType || (CitationSourceType = {}));
export const CLIENT_NAME = 'CHROME_DEVTOOLS';
const CODE_CHUNK_SEPARATOR = '\n`````\n';
export class AidaAbortError extends Error {
}
export class AidaBlockError extends Error {
}
export class AidaClient {
    static buildConsoleInsightsRequest(input) {
        const { hostConfig } = Root.Runtime;
        const disallowLogging = hostConfig.aidaAvailability?.disallowLogging ?? true;
        const chromeVersion = Root.Runtime.getChromeVersion();
        if (!chromeVersion) {
            throw new Error('Cannot determine Chrome version');
        }
        const request = {
            current_message: { parts: [{ text: input }], role: Role.USER },
            client: CLIENT_NAME,
            functionality_type: FunctionalityType.EXPLAIN_ERROR,
            client_feature: ClientFeature.CHROME_CONSOLE_INSIGHTS,
            metadata: {
                disable_user_content_logging: disallowLogging,
                client_version: chromeVersion,
            },
        };
        let temperature = -1;
        let modelId;
        if (hostConfig.devToolsConsoleInsights?.enabled) {
            temperature = hostConfig.devToolsConsoleInsights.temperature ?? -1;
            modelId = hostConfig.devToolsConsoleInsights.modelId;
        }
        if (temperature >= 0) {
            request.options ??= {};
            request.options.temperature = temperature;
        }
        if (modelId) {
            request.options ??= {};
            request.options.model_id = modelId;
        }
        return request;
    }
    static async checkAccessPreconditions() {
        if (!navigator.onLine) {
            return "no-internet" /* AidaAccessPreconditions.NO_INTERNET */;
        }
        const syncInfo = await new Promise(resolve => InspectorFrontendHostInstance.getSyncInformation(syncInfo => resolve(syncInfo)));
        if (!syncInfo.accountEmail) {
            return "no-account-email" /* AidaAccessPreconditions.NO_ACCOUNT_EMAIL */;
        }
        if (syncInfo.isSyncPaused) {
            return "sync-is-paused" /* AidaAccessPreconditions.SYNC_IS_PAUSED */;
        }
        return "available" /* AidaAccessPreconditions.AVAILABLE */;
    }
    async *fetch(request, options) {
        if (!InspectorFrontendHostInstance.doAidaConversation) {
            throw new Error('doAidaConversation is not available');
        }
        const stream = (() => {
            let { promise, resolve, reject } = Promise.withResolvers();
            options?.signal?.addEventListener('abort', () => {
                reject(new AidaAbortError());
            }, { once: true });
            return {
                write: async (data) => {
                    resolve(data);
                    ({ promise, resolve, reject } = Promise.withResolvers());
                },
                close: async () => {
                    resolve(null);
                },
                read: () => {
                    return promise;
                },
                fail: (e) => reject(e),
            };
        })();
        const streamId = bindOutputStream(stream);
        InspectorFrontendHostInstance.doAidaConversation(JSON.stringify(request), streamId, result => {
            if (result.statusCode === 403) {
                stream.fail(new Error('Server responded: permission denied'));
            }
            else if (result.error) {
                stream.fail(new Error(`Cannot send request: ${result.error} ${result.detail || ''}`));
            }
            else if (result.netErrorName === 'net::ERR_TIMED_OUT') {
                stream.fail(new Error('doAidaConversation timed out'));
            }
            else if (result.statusCode !== 200) {
                stream.fail(new Error(`Request failed: ${JSON.stringify(result)}`));
            }
            else {
                void stream.close();
            }
        });
        let chunk;
        const text = [];
        let inCodeChunk = false;
        const functionCalls = [];
        let metadata = { rpcGlobalId: 0 };
        while ((chunk = await stream.read())) {
            let textUpdated = false;
            // The AIDA response is a JSON array of objects, split at the object
            // boundary. Therefore each chunk may start with `[` or `,` and possibly
            // followed by `]`. Each chunk may include one or more objects, so we
            // make sure that each chunk becomes a well-formed JSON array when we
            // parse it by adding `[` and `]` and removing `,` where appropriate.
            if (!chunk.length) {
                continue;
            }
            if (chunk.startsWith(',')) {
                chunk = chunk.slice(1);
            }
            if (!chunk.startsWith('[')) {
                chunk = '[' + chunk;
            }
            if (!chunk.endsWith(']')) {
                chunk = chunk + ']';
            }
            let results;
            try {
                results = JSON.parse(chunk);
            }
            catch (error) {
                throw new Error('Cannot parse chunk: ' + chunk, { cause: error });
            }
            for (const result of results) {
                if ('metadata' in result) {
                    metadata = result.metadata;
                    if (metadata?.attributionMetadata?.attributionAction === RecitationAction.BLOCK) {
                        throw new AidaBlockError();
                    }
                }
                if ('textChunk' in result) {
                    if (inCodeChunk) {
                        text.push(CODE_CHUNK_SEPARATOR);
                        inCodeChunk = false;
                    }
                    text.push(result.textChunk.text);
                    textUpdated = true;
                }
                else if ('codeChunk' in result) {
                    if (!inCodeChunk) {
                        text.push(CODE_CHUNK_SEPARATOR);
                        inCodeChunk = true;
                    }
                    text.push(result.codeChunk.code);
                    textUpdated = true;
                }
                else if ('functionCallChunk' in result) {
                    functionCalls.push({
                        name: result.functionCallChunk.functionCall.name,
                        args: result.functionCallChunk.functionCall.args,
                    });
                }
                else if ('error' in result) {
                    throw new Error(`Server responded: ${JSON.stringify(result)}`);
                }
                else {
                    throw new Error('Unknown chunk result');
                }
            }
            if (textUpdated) {
                yield {
                    explanation: text.join('') + (inCodeChunk ? CODE_CHUNK_SEPARATOR : ''),
                    metadata,
                    completed: false,
                };
            }
        }
        yield {
            explanation: text.join('') + (inCodeChunk ? CODE_CHUNK_SEPARATOR : ''),
            metadata,
            functionCalls: functionCalls.length ? functionCalls :
                undefined,
            completed: true,
        };
    }
    registerClientEvent(clientEvent) {
        const { promise, resolve } = Promise.withResolvers();
        InspectorFrontendHostInstance.registerAidaClientEvent(JSON.stringify({
            client: CLIENT_NAME,
            event_time: new Date().toISOString(),
            ...clientEvent,
        }), resolve);
        return promise;
    }
}
export function convertToUserTierEnum(userTier) {
    if (userTier) {
        switch (userTier) {
            case 'TESTERS':
                return UserTier.TESTERS;
            case 'BETA':
                return UserTier.BETA;
            case 'PUBLIC':
                return UserTier.PUBLIC;
        }
    }
    return UserTier.BETA;
}
let hostConfigTrackerInstance;
export class HostConfigTracker extends Common.ObjectWrapper.ObjectWrapper {
    #pollTimer;
    #aidaAvailability;
    constructor() {
        super();
    }
    static instance() {
        if (!hostConfigTrackerInstance) {
            hostConfigTrackerInstance = new HostConfigTracker();
        }
        return hostConfigTrackerInstance;
    }
    addEventListener(eventType, listener) {
        const isFirst = !this.hasEventListeners(eventType);
        const eventDescriptor = super.addEventListener(eventType, listener);
        if (isFirst) {
            window.clearTimeout(this.#pollTimer);
            void this.pollAidaAvailability();
        }
        return eventDescriptor;
    }
    removeEventListener(eventType, listener) {
        super.removeEventListener(eventType, listener);
        if (!this.hasEventListeners(eventType)) {
            window.clearTimeout(this.#pollTimer);
        }
    }
    async pollAidaAvailability() {
        this.#pollTimer = window.setTimeout(() => this.pollAidaAvailability(), 2000);
        const currentAidaAvailability = await AidaClient.checkAccessPreconditions();
        if (currentAidaAvailability !== this.#aidaAvailability) {
            this.#aidaAvailability = currentAidaAvailability;
            const config = await new Promise(resolve => InspectorFrontendHostInstance.getHostConfig(resolve));
            Object.assign(Root.Runtime.hostConfig, config);
            this.dispatchEventToListeners("aidaAvailabilityChanged" /* Events.AIDA_AVAILABILITY_CHANGED */);
        }
    }
}
//# sourceMappingURL=AidaClient.js.map