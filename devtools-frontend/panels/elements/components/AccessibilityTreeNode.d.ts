export interface AccessibilityTreeNodeData {
    ignored: boolean;
    name: string;
    role: string;
}
export declare class AccessibilityTreeNode extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private ignored;
    private name;
    private role;
    set data(data: AccessibilityTreeNodeData);
    connectedCallback(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-accessibility-tree-node': AccessibilityTreeNode;
    }
}
