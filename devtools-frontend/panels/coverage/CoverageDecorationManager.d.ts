import * as TextUtils from '../../models/text_utils/text_utils.js';
import * as Workspace from '../../models/workspace/workspace.js';
import { type CoverageInfo, type CoverageModel } from './CoverageModel.js';
export declare const decoratorType = "coverage";
export declare class CoverageDecorationManager {
    private coverageModel;
    private readonly textByProvider;
    private readonly uiSourceCodeByContentProvider;
    constructor(coverageModel: CoverageModel);
    reset(): void;
    dispose(): void;
    update(updatedEntries: CoverageInfo[]): void;
    usageByLine(uiSourceCode: Workspace.UISourceCode.UISourceCode): Promise<(boolean | undefined)[]>;
    private updateTexts;
    private updateTextForProvider;
    private rawLocationsForSourceLocation;
    private static compareLocations;
    private onUISourceCodeAdded;
}
export interface RawLocation {
    id: string;
    contentProvider: TextUtils.ContentProvider.ContentProvider;
    line: number;
    column: number;
}
