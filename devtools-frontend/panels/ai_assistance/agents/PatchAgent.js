// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Host from '../../../core/host/host.js';
import { AgentProject } from '../AgentProject.js';
import { debugLog } from '../debug.js';
import { AiAgent, } from './AiAgent.js';
export class PatchAgent extends AiAgent {
    #project;
    #fileUpdateAgent;
    #changeSummary = '';
    async *
    // eslint-disable-next-line require-yield
    handleContextDetails(_select) {
        return;
    }
    type = "patch" /* AgentType.PATCH */;
    preamble = undefined;
    clientFeature = Host.AidaClient.ClientFeature.CHROME_PATCH_AGENT;
    get userTier() {
        return 'TESTERS';
    }
    get options() {
        return {
            temperature: undefined,
            modelId: undefined,
        };
    }
    constructor(opts) {
        super(opts);
        this.#project = new AgentProject(opts.project);
        this.#fileUpdateAgent = opts.fileUpdateAgent ?? new FileUpdateAgent(opts);
        this.declareFunction('listFiles', {
            description: 'Returns a list of all files in the project.',
            parameters: {
                type: 6 /* Host.AidaClient.ParametersTypes.OBJECT */,
                description: '',
                nullable: true,
                properties: {},
            },
            handler: async () => {
                return {
                    result: {
                        files: this.#project.getFiles(),
                    }
                };
            },
        });
        this.declareFunction('searchInFiles', {
            description: 'Searches for a text match in all files in the project. For each match it returns the positions of matches.',
            parameters: {
                type: 6 /* Host.AidaClient.ParametersTypes.OBJECT */,
                description: '',
                nullable: false,
                properties: {
                    query: {
                        type: 1 /* Host.AidaClient.ParametersTypes.STRING */,
                        description: 'The query to search for matches in files',
                        nullable: false,
                    },
                    caseSensitive: {
                        type: 4 /* Host.AidaClient.ParametersTypes.BOOLEAN */,
                        description: 'Whether the query is case sensitive or not',
                        nullable: false,
                    },
                    isRegex: {
                        type: 4 /* Host.AidaClient.ParametersTypes.BOOLEAN */,
                        description: 'Whether the query is a regular expression or not',
                        nullable: true,
                    }
                },
            },
            handler: async (params) => {
                return {
                    result: {
                        matches: await this.#project.searchFiles(params.query, params.caseSensitive, params.isRegex),
                    }
                };
            },
        });
        this.declareFunction('updateFiles', {
            description: 'When called this function performs necesary updates to files',
            parameters: {
                type: 6 /* Host.AidaClient.ParametersTypes.OBJECT */,
                description: '',
                nullable: false,
                properties: {
                    files: {
                        type: 5 /* Host.AidaClient.ParametersTypes.ARRAY */,
                        description: 'List of file names from the project',
                        nullable: false,
                        items: { type: 1 /* Host.AidaClient.ParametersTypes.STRING */, description: 'File name' }
                    }
                },
            },
            handler: async (args) => {
                debugLog('updateFiles', args.files);
                for (const file of args.files) {
                    debugLog('updating', file);
                    const content = this.#project.readFile(file);
                    if (content === undefined) {
                        debugLog(file, 'not found');
                        continue;
                    }
                    const prompt = `I have applied the following CSS changes to my page in Chrome DevTools.

\`\`\`css
${this.#changeSummary}
\`\`\`

Following '===' I provide the source code file. Update the file to apply the same change to it.
CRITICAL: Output the entire file with changes without any other modifications! DO NOT USE MARKDOWN.

===
${content}
`;
                    let response;
                    for await (response of this.#fileUpdateAgent.run(prompt, { selected: null })) {
                        // Get the last response
                    }
                    debugLog('response', response);
                    if (response?.type !== "answer" /* ResponseType.ANSWER */) {
                        debugLog('wrong response type', response);
                        continue;
                    }
                    const updated = response.text;
                    this.#project.writeFile(file, updated);
                    debugLog('updated', updated);
                }
                return {
                    result: {
                        success: true,
                    }
                };
            },
        });
    }
    async *applyChanges(changeSummary) {
        this.#changeSummary = changeSummary;
        const prompt = `I have applied the following CSS changes to my page in Chrome DevTools, what are the files in my source code that I need to change to apply the same change?

\`\`\`css
${changeSummary}
\`\`\`

Try searching using the selectors and if nothing matches, try to find a semantically appropriate place to change.
Consider updating files containing styles like CSS files first!
Call the updateFiles with the list of files to be updated once you are done.
`;
        yield* this.run(prompt, {
            selected: null,
        });
    }
}
/**
 * This is an inner "agent" to apply a change to one file.
 */
export class FileUpdateAgent extends AiAgent {
    async *
    // eslint-disable-next-line require-yield
    handleContextDetails(_select) {
        return;
    }
    type = "patch" /* AgentType.PATCH */;
    preamble = undefined;
    clientFeature = Host.AidaClient.ClientFeature.CHROME_PATCH_AGENT;
    get userTier() {
        return 'TESTERS';
    }
    get options() {
        return {
            temperature: undefined,
            modelId: undefined,
        };
    }
}
//# sourceMappingURL=PatchAgent.js.map