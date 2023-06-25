import type * as Common from '../../core/common/common.js';
import type * as Diff from '../../third_party/diff/diff.js';
export declare function iconDataForResourceType(resourceType: Common.ResourceType.ResourceType): {
    iconName: string;
    color: string;
};
export declare function formatCSSChangesFromDiff(diff: Diff.Diff.DiffArray): Promise<string>;
export declare function highlightElement(element: HTMLElement): void;
