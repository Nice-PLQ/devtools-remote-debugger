import * as LitHtml from '../../lit-html/lit-html.js';
export declare class NewIcon extends LitHtml.LitElement {
    name: string;
    static get styles(): CSSStyleSheet[];
    render(): LitHtml.LitTemplate;
    pathFromName(name: string | null): string;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-new-icon': NewIcon;
    }
}
