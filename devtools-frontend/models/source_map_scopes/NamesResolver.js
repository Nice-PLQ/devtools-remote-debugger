// Copyright 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as SDK from '../../core/sdk/sdk.js';
import * as Bindings from '../bindings/bindings.js';
import * as Formatter from '../formatter/formatter.js';
import * as TextUtils from '../text_utils/text_utils.js';
import * as Platform from '../../core/platform/platform.js';
const scopeToCachedIdentifiersMap = new WeakMap();
const cachedMapByCallFrame = new WeakMap();
const cachedTextByDeferredContent = new WeakMap();
async function getTextFor(contentProvider) {
    // We intentionally cache based on the DeferredContent object rather
    // than the ContentProvider object, which may appear as a more sensible
    // choice, since the content of both Script and UISourceCode objects
    // can change over time.
    const deferredContent = await contentProvider.requestContent();
    let text = cachedTextByDeferredContent.get(deferredContent);
    if (text === undefined) {
        const { content } = deferredContent;
        text = content ? new TextUtils.Text.Text(content) : null;
        cachedTextByDeferredContent.set(deferredContent, text);
    }
    return text;
}
export class IdentifierPositions {
    name;
    positions;
    constructor(name, positions = []) {
        this.name = name;
        this.positions = positions;
    }
    addPosition(lineNumber, columnNumber) {
        this.positions.push({ lineNumber, columnNumber });
    }
}
const tryParseScope = async function (scopeText) {
    const prefixSuffixToTry = [
        // We wrap the scope in a class constructor. This handles the case where the
        // scope is a (non-arrow) function and the case where it is a constructor
        // (so that parsing 'super' calls succeeds).
        { prefix: 'class DummyClass extends DummyBase { constructor', suffix: '}' },
        // Next, we try async generator, this handles functions with yield or await keywords.
        { prefix: 'async function* __DEVTOOLS_DUMMY__', suffix: '' },
        // Finally, try parse as an async arrow function.
        { prefix: 'async ', suffix: '' },
    ];
    for (const { prefix, suffix } of prefixSuffixToTry) {
        const scopeTree = await Formatter.FormatterWorkerPool.formatterWorkerPool().javaScriptScopeTree(prefix + scopeText + suffix);
        if (scopeTree) {
            return { prefixLength: prefix.length, scopeTree };
        }
    }
    return null;
};
const computeScopeTree = async function (functionScope) {
    const functionStartLocation = functionScope.startLocation();
    const functionEndLocation = functionScope.endLocation();
    if (!functionStartLocation || !functionEndLocation) {
        return null;
    }
    const script = functionStartLocation.script();
    if (!script || !script.sourceMapURL || script !== functionEndLocation.script()) {
        return null;
    }
    const text = await getTextFor(script);
    if (!text) {
        return null;
    }
    const scopeRange = new TextUtils.TextRange.TextRange(functionStartLocation.lineNumber, functionStartLocation.columnNumber, functionEndLocation.lineNumber, functionEndLocation.columnNumber);
    const scopeText = text.extract(scopeRange);
    const scopeStart = text.toSourceRange(scopeRange).offset;
    const prefixLengthAndscopeTree = await tryParseScope(scopeText);
    if (!prefixLengthAndscopeTree) {
        return null;
    }
    const { prefixLength, scopeTree } = prefixLengthAndscopeTree;
    return { scopeTree, text, slide: scopeStart - prefixLength };
};
export const scopeIdentifiers = async function (functionScope, scope) {
    if (!functionScope) {
        return null;
    }
    const startLocation = scope.startLocation();
    const endLocation = scope.endLocation();
    if (!startLocation || !endLocation) {
        return null;
    }
    // Parse the function scope to get the scope tree.
    const scopeTreeAndStart = await computeScopeTree(functionScope);
    if (!scopeTreeAndStart) {
        return null;
    }
    const { scopeTree, text, slide } = scopeTreeAndStart;
    // Compute the offset within the scope tree coordinate space.
    const scopeOffsets = {
        start: text.offsetFromPosition(startLocation.lineNumber, startLocation.columnNumber) - slide,
        end: text.offsetFromPosition(endLocation.lineNumber, endLocation.columnNumber) - slide,
    };
    if (!contains(scopeTree, scopeOffsets)) {
        return null;
    }
    // Find the corresponding scope in the scope tree.
    let containingScope = scopeTree;
    const ancestorScopes = [];
    while (true) {
        let childFound = false;
        for (const child of containingScope.children) {
            if (contains(child, scopeOffsets)) {
                // We found a nested containing scope, continue with search there.
                ancestorScopes.push(containingScope);
                containingScope = child;
                childFound = true;
                break;
            }
            // Sanity check: |scope| should not straddle any of the scopes in the tree. That is:
            // Either |scope| is disjoint from |child| or |child| must be inside |scope|.
            // (Or the |scope| is inside |child|, but that case is covered above.)
            if (!disjoint(scopeOffsets, child) && !contains(scopeOffsets, child)) {
                console.error('Wrong nesting of scopes');
                return null;
            }
        }
        if (!childFound) {
            // We found the deepest scope in the tree that contains our scope chain entry.
            break;
        }
    }
    // Now we have containing scope. Collect all the scope variables.
    const boundVariables = [];
    const cursor = new TextUtils.TextCursor.TextCursor(text.lineEndings());
    for (const variable of containingScope.variables) {
        // Skip the fixed-kind variable (i.e., 'this' or 'arguments') if we only found their "definition"
        // without any uses.
        if (variable.kind === 3 /* Formatter.FormatterWorkerPool.DefinitionKind.Fixed */ && variable.offsets.length <= 1) {
            continue;
        }
        const identifier = new IdentifierPositions(variable.name);
        for (const offset of variable.offsets) {
            const start = offset + slide;
            cursor.resetTo(start);
            identifier.addPosition(cursor.lineNumber(), cursor.columnNumber());
        }
        boundVariables.push(identifier);
    }
    // Compute free variables by collecting all the ancestor variables that are used in |containingScope|.
    const freeVariables = [];
    for (const ancestor of ancestorScopes) {
        for (const ancestorVariable of ancestor.variables) {
            let identifier = null;
            for (const offset of ancestorVariable.offsets) {
                if (offset >= containingScope.start && offset < containingScope.end) {
                    if (!identifier) {
                        identifier = new IdentifierPositions(ancestorVariable.name);
                    }
                    const start = offset + slide;
                    cursor.resetTo(start);
                    identifier.addPosition(cursor.lineNumber(), cursor.columnNumber());
                }
            }
            if (identifier) {
                freeVariables.push(identifier);
            }
        }
    }
    return { boundVariables, freeVariables };
    function contains(scope, candidate) {
        return (scope.start <= candidate.start) && (scope.end >= candidate.end);
    }
    function disjoint(scope, other) {
        return (scope.end <= other.start) || (other.end <= scope.start);
    }
};
const identifierAndPunctuationRegExp = /^\s*([A-Za-z_$][A-Za-z_$0-9]*)\s*([.;,=]?)\s*$/;
const resolveScope = async (scope) => {
    let cachedScopeMap = scopeToCachedIdentifiersMap.get(scope);
    const script = scope.callFrame().script;
    const sourceMap = script.debuggerModel.sourceMapManager().sourceMapForClient(script);
    if (!cachedScopeMap || cachedScopeMap.sourceMap !== sourceMap) {
        const identifiersPromise = (async () => {
            const variableMapping = new Map();
            let thisMapping = null;
            if (!sourceMap) {
                return { variableMapping, thisMapping };
            }
            // Extract as much as possible from SourceMap and resolve
            // missing identifier names from SourceMap ranges.
            const promises = [];
            const resolveEntry = (id, handler) => {
                // First see if we have a source map entry with a name for the identifier.
                for (const position of id.positions) {
                    const entry = sourceMap.findEntry(position.lineNumber, position.columnNumber);
                    if (entry && entry.name) {
                        handler(entry.name);
                        return;
                    }
                }
                // If there is no entry with the name field, try to infer the name from the source positions.
                async function resolvePosition() {
                    if (!sourceMap) {
                        return;
                    }
                    // Let us find the first non-empty mapping of |id| and return that. Ideally, we would
                    // try to compute all the mappings and only use the mapping if all the non-empty
                    // mappings agree. However, that can be expensive for identifiers with many uses,
                    // so we iterate sequentially, stopping at the first non-empty mapping.
                    for (const position of id.positions) {
                        const sourceName = await resolveSourceName(script, sourceMap, id.name, position);
                        if (sourceName) {
                            handler(sourceName);
                            return;
                        }
                    }
                }
                promises.push(resolvePosition());
            };
            const functionScope = findFunctionScope();
            const parsedVariables = await scopeIdentifiers(functionScope, scope);
            if (!parsedVariables) {
                return { variableMapping, thisMapping };
            }
            for (const id of parsedVariables.boundVariables) {
                resolveEntry(id, sourceName => {
                    // Let use ignore 'this' mappings - those are handled separately.
                    if (sourceName !== 'this') {
                        variableMapping.set(id.name, sourceName);
                    }
                });
            }
            for (const id of parsedVariables.freeVariables) {
                resolveEntry(id, sourceName => {
                    if (sourceName === 'this') {
                        thisMapping = id.name;
                    }
                });
            }
            await Promise.all(promises).then(getScopeResolvedForTest());
            return { variableMapping, thisMapping };
        })();
        cachedScopeMap = { sourceMap, mappingPromise: identifiersPromise };
        scopeToCachedIdentifiersMap.set(scope, { sourceMap, mappingPromise: identifiersPromise });
    }
    return await cachedScopeMap.mappingPromise;
    async function resolveSourceName(script, sourceMap, name, position) {
        const ranges = sourceMap.findEntryRanges(position.lineNumber, position.columnNumber);
        if (!ranges) {
            return null;
        }
        // Extract the underlying text from the compiled code's range and make sure that
        // it starts with the identifier |name|.
        const uiSourceCode = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiSourceCodeForSourceMapSourceURL(script.debuggerModel, ranges.sourceURL, script.isContentScript());
        if (!uiSourceCode) {
            return null;
        }
        const compiledText = await getTextFor(script);
        if (!compiledText) {
            return null;
        }
        const compiledToken = compiledText.extract(ranges.range);
        const parsedCompiledToken = extractIdentifier(compiledToken);
        if (!parsedCompiledToken) {
            return null;
        }
        const { name: compiledName, punctuation: compiledPunctuation } = parsedCompiledToken;
        if (compiledName !== name) {
            return null;
        }
        // Extract the mapped name from the source code range and ensure that the punctuation
        // matches the one from the compiled code.
        const sourceText = await getTextFor(uiSourceCode);
        if (!sourceText) {
            return null;
        }
        const sourceToken = sourceText.extract(ranges.sourceRange);
        const parsedSourceToken = extractIdentifier(sourceToken);
        if (!parsedSourceToken) {
            return null;
        }
        const { name: sourceName, punctuation: sourcePunctuation } = parsedSourceToken;
        // Accept the source name if it is followed by the same punctuation.
        if (compiledPunctuation === sourcePunctuation) {
            return sourceName;
        }
        // Let us also allow semicolons into commas since that it is a common transformation.
        if (compiledPunctuation === "comma" /* Punctuation.Comma */ && sourcePunctuation === "semicolon" /* Punctuation.Semicolon */) {
            return sourceName;
        }
        return null;
        function extractIdentifier(token) {
            const match = token.match(identifierAndPunctuationRegExp);
            if (!match) {
                return null;
            }
            const name = match[1];
            let punctuation = null;
            switch (match[2]) {
                case '.':
                    punctuation = "dot" /* Punctuation.Dot */;
                    break;
                case ',':
                    punctuation = "comma" /* Punctuation.Comma */;
                    break;
                case ';':
                    punctuation = "semicolon" /* Punctuation.Semicolon */;
                    break;
                case '=':
                    punctuation = "equals" /* Punctuation.Equals */;
                    break;
                case '':
                    punctuation = "none" /* Punctuation.None */;
                    break;
                default:
                    console.error(`Name token parsing error: unexpected token "${match[2]}"`);
                    return null;
            }
            return { name, punctuation };
        }
    }
    function findFunctionScope() {
        // First find the scope in the callframe's scope chain and then find the containing function scope (closure or local).
        const scopeChain = scope.callFrame().scopeChain();
        let scopeIndex = 0;
        for (scopeIndex; scopeIndex < scopeChain.length; scopeIndex++) {
            if (scopeChain[scopeIndex] === scope) {
                break;
            }
        }
        for (scopeIndex; scopeIndex < scopeChain.length; scopeIndex++) {
            const kind = scopeChain[scopeIndex].type();
            if (kind === "local" /* Protocol.Debugger.ScopeType.Local */ || kind === "closure" /* Protocol.Debugger.ScopeType.Closure */) {
                break;
            }
        }
        return scopeIndex === scopeChain.length ? null : scopeChain[scopeIndex];
    }
};
export const resolveScopeChain = async function (callFrame) {
    if (!callFrame) {
        return null;
    }
    const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
    if (pluginManager) {
        const scopeChain = await pluginManager.resolveScopeChain(callFrame);
        if (scopeChain) {
            return scopeChain;
        }
    }
    return callFrame.scopeChain();
};
export const allVariablesInCallFrame = async (callFrame) => {
    const cachedMap = cachedMapByCallFrame.get(callFrame);
    if (cachedMap) {
        return cachedMap;
    }
    const scopeChain = callFrame.scopeChain();
    const nameMappings = await Promise.all(scopeChain.map(resolveScope));
    const reverseMapping = new Map();
    for (const { variableMapping } of nameMappings) {
        for (const [compiledName, originalName] of variableMapping) {
            if (originalName && !reverseMapping.has(originalName)) {
                reverseMapping.set(originalName, compiledName);
            }
        }
    }
    cachedMapByCallFrame.set(callFrame, reverseMapping);
    return reverseMapping;
};
export const resolveExpression = async (callFrame, originalText, uiSourceCode, lineNumber, startColumnNumber, endColumnNumber) => {
    if (uiSourceCode.mimeType() === 'application/wasm') {
        // For WebAssembly disassembly, lookup the different possiblities.
        return `memories["${originalText}"] ?? locals["${originalText}"] ?? tables["${originalText}"] ?? functions["${originalText}"] ?? globals["${originalText}"]`;
    }
    if (!uiSourceCode.contentType().isFromSourceMap()) {
        return '';
    }
    const reverseMapping = await allVariablesInCallFrame(callFrame);
    if (reverseMapping.has(originalText)) {
        return reverseMapping.get(originalText);
    }
    const rawLocations = await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().uiLocationToRawLocations(uiSourceCode, lineNumber, startColumnNumber);
    const rawLocation = rawLocations.find(location => location.debuggerModel === callFrame.debuggerModel);
    if (!rawLocation) {
        return '';
    }
    const script = rawLocation.script();
    if (!script) {
        return '';
    }
    const sourceMap = script.debuggerModel.sourceMapManager().sourceMapForClient(script);
    if (!sourceMap) {
        return '';
    }
    const text = await getTextFor(script);
    if (!text) {
        return '';
    }
    const textRanges = sourceMap.reverseMapTextRanges(uiSourceCode.url(), new TextUtils.TextRange.TextRange(lineNumber, startColumnNumber, lineNumber, endColumnNumber));
    if (textRanges.length !== 1) {
        return '';
    }
    const [compiledRange] = textRanges;
    const subjectText = text.extract(compiledRange);
    if (!subjectText) {
        return '';
    }
    // Map `subjectText` back to the authored code and check that the source map spits out
    // `originalText` again modulo some whitespace/punctuation.
    const authoredText = await getTextFor(uiSourceCode);
    if (!authoredText) {
        return '';
    }
    // Take the "start point" and the "end point - 1" of the compiled range and map them
    // with the source map. Note that for "end point - 1" we need the line endings array to potentially
    // move to the end of the previous line.
    const startRange = sourceMap.findEntryRanges(compiledRange.startLine, compiledRange.startColumn);
    const endLine = compiledRange.endColumn === 0 ? compiledRange.endLine - 1 : compiledRange.endLine;
    const endColumn = compiledRange.endColumn === 0 ? text.lineEndings()[endLine] : compiledRange.endColumn - 1;
    const endRange = sourceMap.findEntryRanges(endLine, endColumn);
    if (!startRange || !endRange) {
        return '';
    }
    // Merge `startRange` with `endRange`. This might not be 100% correct if there are interleaved ranges inbetween.
    const mappedAuthoredText = authoredText.extract(new TextUtils.TextRange.TextRange(startRange.sourceRange.startLine, startRange.sourceRange.startColumn, endRange.sourceRange.endLine, endRange.sourceRange.endColumn));
    // Check that what we found after applying the source map roughly matches `originalText`.
    const originalTextRegex = new RegExp(`^[\\s,;]*${Platform.StringUtilities.escapeForRegExp(originalText)}`, 'g');
    if (!originalTextRegex.test(mappedAuthoredText)) {
        return '';
    }
    return await Formatter.FormatterWorkerPool.formatterWorkerPool().evaluatableJavaScriptSubstring(subjectText);
};
export const resolveThisObject = async (callFrame) => {
    if (!callFrame) {
        return null;
    }
    const scopeChain = callFrame.scopeChain();
    if (scopeChain.length === 0) {
        return callFrame.thisObject();
    }
    const { thisMapping } = await resolveScope(scopeChain[0]);
    if (!thisMapping) {
        return callFrame.thisObject();
    }
    const result = await callFrame.evaluate({
        expression: thisMapping,
        objectGroup: 'backtrace',
        includeCommandLineAPI: false,
        silent: true,
        returnByValue: false,
        generatePreview: true,
    });
    if ('exceptionDetails' in result) {
        return !result.exceptionDetails && result.object ? result.object : callFrame.thisObject();
    }
    return null;
};
export const resolveScopeInObject = function (scope) {
    const startLocation = scope.startLocation();
    const endLocation = scope.endLocation();
    const startLocationScript = startLocation ? startLocation.script() : null;
    if (scope.type() === "global" /* Protocol.Debugger.ScopeType.Global */ || !startLocationScript || !endLocation ||
        !startLocationScript.sourceMapURL || startLocationScript !== endLocation.script()) {
        return scope.object();
    }
    return new RemoteObject(scope);
};
export class RemoteObject extends SDK.RemoteObject.RemoteObject {
    scope;
    object;
    constructor(scope) {
        super();
        this.scope = scope;
        this.object = scope.object();
    }
    customPreview() {
        return this.object.customPreview();
    }
    get objectId() {
        return this.object.objectId;
    }
    get type() {
        return this.object.type;
    }
    get subtype() {
        return this.object.subtype;
    }
    // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get value() {
        return this.object.value;
    }
    get description() {
        return this.object.description;
    }
    get hasChildren() {
        return this.object.hasChildren;
    }
    get preview() {
        return this.object.preview;
    }
    arrayLength() {
        return this.object.arrayLength();
    }
    getOwnProperties(generatePreview) {
        return this.object.getOwnProperties(generatePreview);
    }
    async getAllProperties(accessorPropertiesOnly, generatePreview) {
        const allProperties = await this.object.getAllProperties(accessorPropertiesOnly, generatePreview);
        const { variableMapping } = await resolveScope(this.scope);
        const properties = allProperties.properties;
        const internalProperties = allProperties.internalProperties;
        const newProperties = [];
        if (properties) {
            for (let i = 0; i < properties.length; ++i) {
                const property = properties[i];
                const name = variableMapping.get(property.name) || properties[i].name;
                if (!property.value) {
                    continue;
                }
                newProperties.push(new SDK.RemoteObject.RemoteObjectProperty(name, property.value, property.enumerable, property.writable, property.isOwn, property.wasThrown, property.symbol, property.synthetic));
            }
        }
        return { properties: newProperties, internalProperties: internalProperties };
    }
    async setPropertyValue(argumentName, value) {
        const { variableMapping } = await resolveScope(this.scope);
        let name;
        if (typeof argumentName === 'string') {
            name = argumentName;
        }
        else {
            name = argumentName.value;
        }
        let actualName = name;
        for (const compiledName of variableMapping.keys()) {
            if (variableMapping.get(compiledName) === name) {
                actualName = compiledName;
                break;
            }
        }
        return this.object.setPropertyValue(actualName, value);
    }
    async deleteProperty(name) {
        return this.object.deleteProperty(name);
    }
    callFunction(functionDeclaration, args) {
        return this.object.callFunction(functionDeclaration, args);
    }
    callFunctionJSON(functionDeclaration, args) {
        return this.object.callFunctionJSON(functionDeclaration, args);
    }
    release() {
        this.object.release();
    }
    debuggerModel() {
        return this.object.debuggerModel();
    }
    runtimeModel() {
        return this.object.runtimeModel();
    }
    isNode() {
        return this.object.isNode();
    }
}
// Resolve the frame's function name using the name associated with the opening
// paren that starts the scope. If there is no name associated with the scope
// start or if the function scope does not start with a left paren (e.g., arrow
// function with one parameter), the resolution returns null.
async function getFunctionNameFromScopeStart(script, lineNumber, columnNumber) {
    // To reduce the overhead of resolving function names,
    // we check for source maps first and immediately leave
    // this function if the script doesn't have a sourcemap.
    const sourceMap = script.debuggerModel.sourceMapManager().sourceMapForClient(script);
    if (!sourceMap) {
        return null;
    }
    const name = sourceMap.findEntry(lineNumber, columnNumber)?.name;
    if (!name) {
        return null;
    }
    const text = await getTextFor(script);
    if (!text) {
        return null;
    }
    const openRange = new TextUtils.TextRange.TextRange(lineNumber, columnNumber, lineNumber, columnNumber + 1);
    if (text.extract(openRange) !== '(') {
        return null;
    }
    return name;
}
export async function resolveDebuggerFrameFunctionName(frame) {
    const startLocation = frame.localScope()?.startLocation();
    if (!startLocation) {
        return null;
    }
    return await getFunctionNameFromScopeStart(frame.script, startLocation.lineNumber, startLocation.columnNumber);
}
export async function resolveProfileFrameFunctionName({ scriptId, lineNumber, columnNumber }, target) {
    if (!target || lineNumber === undefined || columnNumber === undefined || scriptId === undefined) {
        return null;
    }
    const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
    const script = debuggerModel?.scriptForId(String(scriptId));
    if (!debuggerModel || !script) {
        return null;
    }
    const debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
    const location = new SDK.DebuggerModel.Location(debuggerModel, scriptId, lineNumber, columnNumber);
    const functionInfoFromPlugin = await debuggerWorkspaceBinding.pluginManager?.getFunctionInfo(script, location);
    if (functionInfoFromPlugin && 'frames' in functionInfoFromPlugin) {
        const last = functionInfoFromPlugin.frames.at(-1);
        if (last?.name) {
            return last.name;
        }
    }
    return await getFunctionNameFromScopeStart(script, lineNumber, columnNumber);
}
// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
// eslint-disable-next-line @typescript-eslint/naming-convention
let _scopeResolvedForTest = function () { };
export const getScopeResolvedForTest = () => {
    return _scopeResolvedForTest;
};
export const setScopeResolvedForTest = (scope) => {
    _scopeResolvedForTest = scope;
};
//# sourceMappingURL=NamesResolver.js.map