// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Host from '../../../core/host/host.js';
import * as Root from '../../../core/root/root.js';
import { debugLog, isDebugMode } from '../debug.js';
export const MAX_STEPS = 10;
export class ConversationContext {
    isOriginAllowed(agentOrigin) {
        if (!agentOrigin) {
            return true;
        }
        // Currently does not handle opaque origins because they
        // are not available to DevTools, instead checks
        // that serialization of the origin is the same
        // https://html.spec.whatwg.org/#ascii-serialisation-of-an-origin.
        return this.getOrigin() === agentOrigin;
    }
    /**
     * This method is called at the start of `AiAgent.run`.
     * It will be overridden in subclasses to fetch data related to the context item.
     */
    async refresh() {
        return;
    }
}
const OBSERVATION_PREFIX = 'OBSERVATION: ';
/**
 * AiAgent is a base class for implementing an interaction with AIDA
 * that involves one or more requests being sent to AIDA optionally
 * utilizing function calling.
 *
 * TODO: missing a test that action code is yielded before the
 * confirmation dialog.
 * TODO: missing a test for an error if it took
 * more than MAX_STEPS iterations.
 */
export class AiAgent {
    #sessionId = crypto.randomUUID();
    #aidaClient;
    #serverSideLoggingEnabled;
    confirmSideEffect;
    #functionDeclarations = new Map();
    /**
     * Used in the debug mode and evals.
     */
    #structuredLog = [];
    /**
     * Might need to be part of history in case we allow chatting in
     * historical conversations.
     */
    #origin;
    #context;
    #id = crypto.randomUUID();
    #history = [];
    constructor(opts) {
        this.#aidaClient = opts.aidaClient;
        this.#serverSideLoggingEnabled = opts.serverSideLoggingEnabled ?? false;
        this.confirmSideEffect = opts.confirmSideEffectForTest ?? (() => Promise.withResolvers());
    }
    async enhanceQuery(query) {
        return query;
    }
    buildRequest(part, role) {
        const parts = Array.isArray(part) ? part : [part];
        const currentMessage = {
            parts,
            role,
        };
        const history = [...this.#history];
        const declarations = [];
        for (const [name, definition] of this.#functionDeclarations.entries()) {
            declarations.push({
                name,
                description: definition.description,
                parameters: definition.parameters,
            });
        }
        function validTemperature(temperature) {
            return typeof temperature === 'number' && temperature >= 0 ? temperature : undefined;
        }
        const enableAidaFunctionCalling = declarations.length && !this.functionCallEmulationEnabled;
        const request = {
            client: Host.AidaClient.CLIENT_NAME,
            current_message: currentMessage,
            preamble: this.preamble,
            historical_contexts: history.length ? history : undefined,
            ...(enableAidaFunctionCalling ? { function_declarations: declarations } : {}),
            options: {
                temperature: validTemperature(this.options.temperature),
                model_id: this.options.modelId || undefined,
            },
            metadata: {
                disable_user_content_logging: !(this.#serverSideLoggingEnabled ?? false),
                string_session_id: this.#sessionId,
                user_tier: Host.AidaClient.convertToUserTierEnum(this.userTier),
                client_version: Root.Runtime.getChromeVersion(),
            },
            functionality_type: enableAidaFunctionCalling ? Host.AidaClient.FunctionalityType.AGENTIC_CHAT :
                Host.AidaClient.FunctionalityType.CHAT,
            client_feature: this.clientFeature,
        };
        return request;
    }
    get id() {
        return this.#id;
    }
    get origin() {
        return this.#origin;
    }
    /**
     * Parses a streaming text response into a
     * though/action/title/answer/suggestions component. This is only used
     * by StylingAgent.
     */
    parseTextResponse(response) {
        return { answer: response };
    }
    /**
     * Declare a function that the AI model can call.
     * @param name - The name of the function
     * @param declaration - the function declaration. Currently functions must:
     * 1. Return an object of serializable key/value pairs. You cannot return
     *    anything other than a plain JavaScript object that can be serialized.
     * 2. Take one parameter which is an object that can have
     *    multiple keys and values. For example, rather than a function being called
     *    with two args, `foo` and `bar`, you should instead have the function be
     *    called with one object with `foo` and `bar` keys.
     */
    declareFunction(name, declaration) {
        if (this.#functionDeclarations.has(name)) {
            throw new Error(`Duplicate function declaration ${name}`);
        }
        this.#functionDeclarations.set(name, declaration);
    }
    formatParsedAnswer({ answer }) {
        return answer;
    }
    /**
     * Special mode for StylingAgent that turns custom text output into a
     * function call.
     */
    functionCallEmulationEnabled = false;
    emulateFunctionCall(_aidaResponse) {
        throw new Error('Unexpected emulateFunctionCall. Only StylingAgent implements function call emulation');
    }
    async *run(initialQuery, options, imageInput, imageId) {
        await options.selected?.refresh();
        // First context set on the agent determines its origin from now on.
        if (options.selected && this.#origin === undefined && options.selected) {
            this.#origin = options.selected.getOrigin();
        }
        // Remember if the context that is set.
        if (options.selected && !this.#context) {
            this.#context = options.selected;
        }
        const enhancedQuery = await this.enhanceQuery(initialQuery, options.selected, Boolean(imageInput));
        Host.userMetrics.freestylerQueryLength(enhancedQuery.length);
        let query;
        query = imageInput ? [{ text: enhancedQuery }, imageInput] : [{ text: enhancedQuery }];
        // Request is built here to capture history up to this point.
        let request = this.buildRequest(query, Host.AidaClient.Role.USER);
        yield {
            type: "user-query" /* ResponseType.USER_QUERY */,
            query: initialQuery,
            imageInput,
            imageId,
        };
        yield* this.handleContextDetails(options.selected);
        for (let i = 0; i < MAX_STEPS; i++) {
            yield {
                type: "querying" /* ResponseType.QUERYING */,
            };
            let rpcId;
            let textResponse = '';
            let functionCall = undefined;
            try {
                for await (const fetchResult of this.#aidaFetch(request, { signal: options.signal })) {
                    rpcId = fetchResult.rpcId;
                    textResponse = fetchResult.text ?? '';
                    functionCall = fetchResult.functionCall;
                    if (!functionCall && !fetchResult.completed) {
                        const parsed = this.parseTextResponse(textResponse);
                        const partialAnswer = 'answer' in parsed ? parsed.answer : '';
                        if (!partialAnswer) {
                            continue;
                        }
                        // Only yield partial responses here and do not add partial answers to the history.
                        yield {
                            type: "answer" /* ResponseType.ANSWER */,
                            text: partialAnswer,
                            complete: false,
                        };
                    }
                    if (functionCall) {
                        break;
                    }
                }
            }
            catch (err) {
                debugLog('Error calling the AIDA API', err);
                let error = "unknown" /* ErrorType.UNKNOWN */;
                if (err instanceof Host.AidaClient.AidaAbortError) {
                    error = "abort" /* ErrorType.ABORT */;
                }
                else if (err instanceof Host.AidaClient.AidaBlockError) {
                    error = "block" /* ErrorType.BLOCK */;
                }
                yield this.#createErrorResponse(error);
                break;
            }
            this.#history.push(request.current_message);
            if (textResponse) {
                const parsedResponse = this.parseTextResponse(textResponse);
                if (!('answer' in parsedResponse)) {
                    throw new Error('Expected a completed response to have an answer');
                }
                this.#history.push({
                    parts: [{
                            text: this.formatParsedAnswer(parsedResponse),
                        }],
                    role: Host.AidaClient.Role.MODEL,
                });
                Host.userMetrics.actionTaken(Host.UserMetrics.Action.AiAssistanceAnswerReceived);
                yield {
                    type: "answer" /* ResponseType.ANSWER */,
                    text: parsedResponse.answer,
                    suggestions: parsedResponse.suggestions,
                    complete: true,
                    rpcId,
                };
                break;
            }
            if (functionCall) {
                try {
                    const result = yield* this.#callFunction(functionCall.name, functionCall.args, options);
                    if (options.signal?.aborted) {
                        yield this.#createErrorResponse("abort" /* ErrorType.ABORT */);
                        break;
                    }
                    query = this.functionCallEmulationEnabled ? { text: OBSERVATION_PREFIX + result.result } : {
                        functionResponse: {
                            name: functionCall.name,
                            response: result,
                        },
                    };
                    request = this.buildRequest(query, this.functionCallEmulationEnabled ? Host.AidaClient.Role.USER : Host.AidaClient.Role.ROLE_UNSPECIFIED);
                }
                catch {
                    yield this.#createErrorResponse("unknown" /* ErrorType.UNKNOWN */);
                    break;
                }
            }
            else {
                yield this.#createErrorResponse(i - 1 === MAX_STEPS ? "max-steps" /* ErrorType.MAX_STEPS */ : "unknown" /* ErrorType.UNKNOWN */);
                break;
            }
        }
        if (isDebugMode()) {
            window.dispatchEvent(new CustomEvent('aiassistancedone'));
        }
    }
    async *#callFunction(name, args, options) {
        const call = this.#functionDeclarations.get(name);
        if (!call) {
            throw new Error(`Function ${name} is not found.`);
        }
        if (this.functionCallEmulationEnabled) {
            if (!call.displayInfoFromArgs) {
                throw new Error('functionCallEmulationEnabled requires all functions to provide displayInfoFromArgs');
            }
            // Emulated function calls are formatted as text.
            this.#history.push({
                parts: [{ text: this.#formatParsedStep(call.displayInfoFromArgs(args)) }],
                role: Host.AidaClient.Role.MODEL,
            });
        }
        else {
            this.#history.push({
                parts: [{
                        functionCall: {
                            name,
                            args,
                        },
                    }],
                role: Host.AidaClient.Role.MODEL,
            });
        }
        let code;
        if (call.displayInfoFromArgs) {
            const { title, thought, action: callCode } = call.displayInfoFromArgs(args);
            code = callCode;
            if (title) {
                yield {
                    type: "title" /* ResponseType.TITLE */,
                    title,
                };
            }
            if (thought) {
                yield {
                    type: "thought" /* ResponseType.THOUGHT */,
                    thought,
                };
            }
        }
        let result = await call.handler(args, options);
        if ('requiresApproval' in result) {
            if (code) {
                yield {
                    type: "action" /* ResponseType.ACTION */,
                    code,
                    canceled: false,
                };
            }
            const sideEffectConfirmationPromiseWithResolvers = this.confirmSideEffect();
            void sideEffectConfirmationPromiseWithResolvers.promise.then(result => {
                Host.userMetrics.actionTaken(result ? Host.UserMetrics.Action.AiAssistanceSideEffectConfirmed :
                    Host.UserMetrics.Action.AiAssistanceSideEffectRejected);
            });
            if (options?.signal?.aborted) {
                sideEffectConfirmationPromiseWithResolvers.resolve(false);
            }
            options?.signal?.addEventListener('abort', () => {
                sideEffectConfirmationPromiseWithResolvers.resolve(false);
            }, { once: true });
            yield {
                type: "side-effect" /* ResponseType.SIDE_EFFECT */,
                confirm: (result) => {
                    sideEffectConfirmationPromiseWithResolvers.resolve(result);
                },
            };
            const approvedRun = await sideEffectConfirmationPromiseWithResolvers.promise;
            if (!approvedRun) {
                yield {
                    type: "action" /* ResponseType.ACTION */,
                    code,
                    output: 'Error: User denied code execution with side effects.',
                    canceled: true,
                };
                return {
                    result: 'Error: User denied code execution with side effects.',
                };
            }
            result = await call.handler(args, {
                ...options,
                approved: approvedRun,
            });
        }
        if ('result' in result) {
            yield {
                type: "action" /* ResponseType.ACTION */,
                code,
                output: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
                canceled: false,
            };
        }
        if ('error' in result) {
            yield {
                type: "action" /* ResponseType.ACTION */,
                code,
                output: result.error,
                canceled: false,
            };
        }
        return result;
    }
    async *#aidaFetch(request, options) {
        let aidaResponse = undefined;
        let response = '';
        let rpcId;
        for await (aidaResponse of this.#aidaClient.fetch(request, options)) {
            if (aidaResponse.functionCalls?.length) {
                debugLog('functionCalls.length', aidaResponse.functionCalls.length);
                yield {
                    rpcId,
                    functionCall: aidaResponse.functionCalls[0],
                    completed: true,
                };
                break;
            }
            if (this.functionCallEmulationEnabled) {
                const emulatedFunctionCall = this.emulateFunctionCall(aidaResponse);
                if (emulatedFunctionCall === 'wait-for-completion') {
                    continue;
                }
                if (emulatedFunctionCall !== 'no-function-call') {
                    yield {
                        rpcId,
                        functionCall: emulatedFunctionCall,
                        completed: true,
                    };
                    break;
                }
            }
            response = aidaResponse.explanation;
            rpcId = aidaResponse.metadata.rpcGlobalId ?? rpcId;
            yield {
                rpcId,
                text: aidaResponse.explanation,
                completed: aidaResponse.completed,
            };
        }
        debugLog({
            request,
            response: aidaResponse,
        });
        if (isDebugMode()) {
            this.#structuredLog.push({
                request: structuredClone(request),
                response,
                aidaResponse,
            });
            localStorage.setItem('aiAssistanceStructuredLog', JSON.stringify(this.#structuredLog));
        }
    }
    #formatParsedStep(step) {
        let text = '';
        if (step.thought) {
            text = `THOUGHT: ${step.thought}`;
        }
        if (step.title) {
            text += `\nTITLE: ${step.title}`;
        }
        if (step.action) {
            text += `\nACTION
${step.action}
STOP`;
        }
        return text;
    }
    #removeLastRunParts() {
        this.#history.splice(this.#history.findLastIndex(item => {
            return item.role === Host.AidaClient.Role.USER;
        }));
    }
    #createErrorResponse(error) {
        this.#removeLastRunParts();
        if (error !== "abort" /* ErrorType.ABORT */) {
            Host.userMetrics.actionTaken(Host.UserMetrics.Action.AiAssistanceError);
        }
        return {
            type: "error" /* ResponseType.ERROR */,
            error,
        };
    }
}
//# sourceMappingURL=AiAgent.js.map