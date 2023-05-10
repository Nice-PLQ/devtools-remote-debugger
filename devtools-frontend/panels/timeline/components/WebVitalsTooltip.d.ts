import * as LitHtml from '../../../ui/lit-html/lit-html.js';
declare global {
    interface HTMLElementTagNameMap {
        'devtools-timeline-webvitals-tooltip': WebVitalsTooltip;
    }
}
export interface WebVitalsTooltipData {
    content: LitHtml.TemplateResult | null;
}
export declare class WebVitalsTooltip extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private content;
    set data(data: WebVitalsTooltipData);
    connectedCallback(): void;
    private render;
}
