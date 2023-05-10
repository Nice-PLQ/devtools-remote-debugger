import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
export declare function cursorTooltip(source: (state: CodeMirror.EditorState, pos: number) => Promise<(() => CodeMirror.TooltipView) | null>): CodeMirror.Extension;
