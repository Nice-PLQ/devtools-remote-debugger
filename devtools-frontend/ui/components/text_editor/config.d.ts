import * as CM from '../../../third_party/codemirror.next/codemirror.next.js';
export declare const dynamicSetting: CM.Facet<DynamicSetting<unknown>, readonly DynamicSetting<unknown>[]>;
export declare class DynamicSetting<T> {
    readonly settingName: string;
    private readonly getExtension;
    compartment: CM.Compartment;
    extension: CM.Extension;
    constructor(settingName: string, getExtension: (value: T, state: CM.EditorState) => CM.Extension);
    sync(state: CM.EditorState, value: T): CM.StateEffect<unknown> | null;
    static bool(name: string, enabled: CM.Extension, disabled?: CM.Extension): DynamicSetting<boolean>;
}
export declare const tabMovesFocus: DynamicSetting<boolean>;
export declare const autocompletion: CM.Extension;
export declare const sourcesAutocompletion: DynamicSetting<boolean>;
export declare const bracketMatching: DynamicSetting<boolean>;
export declare const codeFolding: DynamicSetting<boolean>;
export declare function guessIndent(doc: CM.Text): string;
export declare const autoDetectIndent: DynamicSetting<boolean>;
export declare const showWhitespace: DynamicSetting<string>;
export declare const allowScrollPastEof: DynamicSetting<boolean>;
export declare const indentUnit: DynamicSetting<string>;
export declare const domWordWrap: DynamicSetting<boolean>;
export declare function baseConfiguration(text: string): CM.Extension;
export declare const showCompletionHint: CM.ViewPlugin<{
    decorations: CM.DecorationSet;
    currentHint: string | null;
    update(update: CM.ViewUpdate): void;
    topCompletion(state: CM.EditorState): string | null;
}>;
export declare function contentIncludingHint(view: CM.EditorView): string;
