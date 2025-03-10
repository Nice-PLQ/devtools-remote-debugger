// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import { compare } from './StringUtilities.js';
const defaultWarningMessages = {
    deprecratedSyntax() {
        return 'Deprecated syntax found. Please use: <name>;dur=<duration>;desc=<description>';
    },
    duplicateParameter(parameter) {
        return `Duplicate parameter "${parameter}" ignored.`;
    },
    noValueFoundForParameter(parameter) {
        return `No value found for parameter "${parameter}".`;
    },
    unrecognizedParameter(parameter) {
        return `Unrecognized parameter "${parameter}".`;
    },
    extraneousTrailingCharacters() {
        return 'Extraneous trailing characters.';
    },
    unableToParseValue(parameter, value) {
        return `Unable to parse "${parameter}" value "${value}".`;
    },
};
export class ServerTiming {
    metric;
    value;
    description;
    start;
    constructor(metric, value, description, start) {
        this.metric = metric;
        this.value = value;
        this.description = description;
        this.start = start;
    }
    static parseHeaders(headers, warningMessages = defaultWarningMessages) {
        const rawServerTimingHeaders = headers.filter(item => item.name.toLowerCase() === 'server-timing');
        if (!rawServerTimingHeaders.length) {
            return null;
        }
        const serverTimings = rawServerTimingHeaders.reduce((memo, header) => {
            const timing = this.createFromHeaderValue(header.value, warningMessages);
            memo.push(...timing.map(function (entry) {
                return new ServerTiming(entry.name, entry.hasOwnProperty('dur') ? entry.dur : null, entry.hasOwnProperty('desc') ? entry.desc : '', entry.hasOwnProperty('start') ? entry.start : null);
            }));
            return memo;
        }, []);
        serverTimings.sort((a, b) => compare(a.metric.toLowerCase(), b.metric.toLowerCase()));
        return serverTimings;
    }
    /**
     * TODO(crbug.com/1011811): Instead of using !Object<string, *> we should have a proper type
     *                          with #name, desc and dur properties.
     */
    static createFromHeaderValue(valueString, warningMessages = defaultWarningMessages) {
        function trimLeadingWhiteSpace() {
            valueString = valueString.replace(/^\s*/, '');
        }
        function consumeDelimiter(char) {
            console.assert(char.length === 1);
            trimLeadingWhiteSpace();
            if (valueString.charAt(0) !== char) {
                return false;
            }
            valueString = valueString.substring(1);
            return true;
        }
        function consumeToken() {
            // https://tools.ietf.org/html/rfc7230#appendix-B
            const result = /^(?:\s*)([\w!#$%&'*+\-.^`|~]+)(?:\s*)(.*)/.exec(valueString);
            if (!result) {
                return null;
            }
            valueString = result[2];
            return result[1];
        }
        function consumeTokenOrQuotedString() {
            trimLeadingWhiteSpace();
            if (valueString.charAt(0) === '"') {
                return consumeQuotedString();
            }
            return consumeToken();
        }
        function consumeQuotedString() {
            console.assert(valueString.charAt(0) === '"');
            valueString = valueString.substring(1); // remove leading DQUOTE
            let value = '';
            while (valueString.length) {
                // split into two parts:
                //  -everything before the first " or \
                //  -everything else
                const result = /^([^"\\]*)(.*)/.exec(valueString);
                if (!result) {
                    return null; // not a valid quoted-string
                }
                value += result[1];
                if (result[2].charAt(0) === '"') {
                    // we have found our closing "
                    valueString = result[2].substring(1); // strip off everything after the closing "
                    return value; // we are done here
                }
                console.assert(result[2].charAt(0) === '\\');
                // special rules for \ found in quoted-string (https://tools.ietf.org/html/rfc7230#section-3.2.6)
                value += result[2].charAt(1); // grab the character AFTER the \ (if there was one)
                valueString = result[2].substring(2); // strip off \ and next character
            }
            return null; // not a valid quoted-string
        }
        function consumeExtraneous() {
            const result = /([,;].*)/.exec(valueString);
            if (result) {
                valueString = result[1];
            }
        }
        const result = [];
        let name;
        while ((name = consumeToken()) !== null) {
            const entry = { name };
            if (valueString.charAt(0) === '=') {
                this.showWarning(warningMessages['deprecratedSyntax']());
            }
            while (consumeDelimiter(';')) {
                let paramName;
                if ((paramName = consumeToken()) === null) {
                    continue;
                }
                paramName = paramName.toLowerCase();
                const parseParameter = this.getParserForParameter(paramName, warningMessages);
                let paramValue = null;
                if (consumeDelimiter('=')) {
                    // always parse the value, even if we don't recognize the parameter #name
                    paramValue = consumeTokenOrQuotedString();
                    consumeExtraneous();
                }
                if (parseParameter) {
                    // paramName is valid
                    if (entry.hasOwnProperty(paramName)) {
                        this.showWarning(warningMessages['duplicateParameter'](paramName));
                        continue;
                    }
                    if (paramValue === null) {
                        this.showWarning(warningMessages['noValueFoundForParameter'](paramName));
                    }
                    parseParameter.call(this, entry, paramValue);
                }
                else {
                    // paramName is not valid
                    this.showWarning(warningMessages['unrecognizedParameter'](paramName));
                }
            }
            result.push(entry);
            if (!consumeDelimiter(',')) {
                break;
            }
        }
        if (valueString.length) {
            this.showWarning(warningMessages['extraneousTrailingCharacters']());
        }
        return result;
    }
    static getParserForParameter(paramName, warningMessages) {
        switch (paramName) {
            case 'dur': {
                function durParser(entry, 
                // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                paramValue) {
                    entry.dur = 0;
                    if (paramValue !== null) {
                        const duration = parseFloat(paramValue);
                        if (isNaN(duration)) {
                            ServerTiming.showWarning(warningMessages['unableToParseValue'](paramName, paramValue));
                            return;
                        }
                        entry.dur = duration;
                    }
                }
                return durParser;
            }
            case 'start': {
                function startParser(entry, 
                // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                paramValue) {
                    entry.start = null;
                    if (paramValue !== null) {
                        const start = parseFloat(paramValue);
                        if (isNaN(start)) {
                            ServerTiming.showWarning(warningMessages['unableToParseValue'](paramName, paramValue));
                            return;
                        }
                        entry.start = start;
                    }
                }
                return startParser;
            }
            case 'desc': {
                function descParser(entry, paramValue) {
                    entry.desc = paramValue || '';
                }
                return descParser;
            }
            default: {
                return null;
            }
        }
    }
    static showWarning(msg) {
        console.warn(`ServerTiming: ${msg}`);
    }
}
//# sourceMappingURL=ServerTiming.js.map