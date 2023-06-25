// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as CodeMirror from '../../../../third_party/codemirror.next/codemirror.next.js';
const cssParser = CodeMirror.css.cssLanguage.parser;
// color-mix() = color-mix( <color-interpolation-method> , [ <color> && <percentage [0,100]>? ]#{2})
function parseColorAndPercentage(cursor, referenceText) {
    const parts = [];
    while (cursor.nextSibling()) {
        if (cursor.name === ',' || cursor.name === ')') {
            break;
        }
        if (cursor.name === 'ValueName' || cursor.name === 'CallExpression' || cursor.name === 'ColorLiteral') {
            parts.push({
                name: "V" /* PartName.Value */,
                value: referenceText.substring(cursor.from, cursor.to),
            });
        }
        else if (cursor.name === 'NumberLiteral') {
            const numberText = referenceText.substring(cursor.from, cursor.to);
            if (!numberText.includes('%')) {
                return null;
            }
            parts.push({
                name: "P" /* PartName.Percentage */,
                value: numberText,
            });
        }
        else {
            return null;
        }
    }
    return parts;
}
function parseColorInterpolationMethod(cursor, referenceText) {
    let colorInterpolationMethod = '';
    while (cursor.nextSibling()) {
        if (cursor.name === ',') {
            break;
        }
        colorInterpolationMethod += referenceText.substring(cursor.from, cursor.to) + ' ';
    }
    if (cursor.name !== ',') {
        return null;
    }
    return {
        name: "IM" /* PartName.InterpolationMethod */,
        value: colorInterpolationMethod.trimEnd(),
    };
}
function isValidParam(param) {
    const hasOneValue = param.filter(paramPart => paramPart.name === "V" /* PartName.Value */).length === 1;
    const hasAtMostOnePercentage = param.filter(paramPart => paramPart.name === "P" /* PartName.Percentage */).length <= 1;
    return hasOneValue && hasAtMostOnePercentage;
}
export class ColorMixModel {
    parts;
    constructor(parts) {
        this.parts = parts;
    }
    static parse(text) {
        const textToParse = `*{color:${text};}`;
        const parsed = cssParser.parse(textToParse);
        // Take the cursor from declaration
        const cursor = parsed.cursorAt(textToParse.indexOf(':') + 1);
        // Move until the `ArgList`
        while (cursor.name !== 'ArgList' && cursor.next(true)) {
        }
        if (cursor.name !== 'ArgList') {
            return null;
        }
        // We're on the `ArgList`, enter into it
        cursor.firstChild();
        // Parse first argument <color-interpolation-method>
        const colorInterpolationMethodPart = parseColorInterpolationMethod(cursor, textToParse);
        if (!colorInterpolationMethodPart) {
            return null;
        }
        // Parse first color and percentage
        const firstColorAndPercentage = parseColorAndPercentage(cursor, textToParse);
        if (!firstColorAndPercentage) {
            return null;
        }
        // Parse second color and percentage
        const secondColorAndPercentage = parseColorAndPercentage(cursor, textToParse);
        if (!secondColorAndPercentage) {
            return null;
        }
        // Validate correctness of the syntax
        // * interpolation method should start with `in`
        if (!colorInterpolationMethodPart.value.startsWith('in')) {
            return null;
        }
        // * Parts can't have more than one value
        // * Parts can't have more than one percentage
        if (!isValidParam(firstColorAndPercentage) || !isValidParam(secondColorAndPercentage)) {
            return null;
        }
        return new ColorMixModel([
            colorInterpolationMethodPart,
            {
                name: "PA" /* PartName.Param */,
                value: firstColorAndPercentage,
            },
            {
                name: "PA" /* PartName.Param */,
                value: secondColorAndPercentage,
            },
        ]);
    }
}
//# sourceMappingURL=ColorMixModel.js.map