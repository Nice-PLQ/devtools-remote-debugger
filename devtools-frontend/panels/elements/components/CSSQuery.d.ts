export interface CSSQueryData {
    queryPrefix: string;
    queryName?: string;
    queryText: string;
    onQueryTextClick?: (event: Event) => void;
}
export declare class CSSQuery extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private queryPrefix;
    private queryName?;
    private queryText;
    private onQueryTextClick?;
    set data(data: CSSQueryData);
    connectedCallback(): void;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-css-query': CSSQuery;
    }
}
