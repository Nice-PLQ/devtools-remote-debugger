export declare class ColorMixModel {
    parts: Parts;
    constructor(parts: Parts);
    static parse(text: string): ColorMixModel | null;
}
export declare const enum PartName {
    InterpolationMethod = "IM",
    Param = "PA",
    Value = "V",
    Percentage = "P"
}
export type ParamPart = {
    name: PartName.Percentage;
    value: string;
} | {
    name: PartName.Value;
    value: string;
};
type Parts = [
    {
        name: PartName.InterpolationMethod;
        value: string;
    },
    {
        name: PartName.Param;
        value: ParamPart[];
    },
    {
        name: PartName.Param;
        value: ParamPart[];
    }
];
export {};
