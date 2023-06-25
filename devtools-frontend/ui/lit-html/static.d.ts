import * as Lit from '../../third_party/lit/lit.js';
export interface Static {
    value: unknown;
    $$static$$: true;
}
type TemplateValues = Static | unknown;
type FlattenedTemplateValues = {
    strings: TemplateStringsArray;
    valueMap: boolean[];
};
export declare function flattenTemplate(strings: TemplateStringsArray, ...values: TemplateValues[]): FlattenedTemplateValues;
export declare function html(strings: TemplateStringsArray, ...values: TemplateValues[]): Lit.TemplateResult;
export declare function literal(value: TemplateStringsArray): Static;
export {};
