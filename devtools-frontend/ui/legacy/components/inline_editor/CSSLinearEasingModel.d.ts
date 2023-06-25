export type Point = {
    input: number;
    output: number;
};
export declare class CSSLinearEasingModel {
    #private;
    private constructor();
    static parse(text: string): CSSLinearEasingModel | null;
    addPoint(point: Point, index?: number): void;
    removePoint(index: number): void;
    setPoint(index: number, point: Point): void;
    points(): Point[];
    asCSSText(): string;
}
