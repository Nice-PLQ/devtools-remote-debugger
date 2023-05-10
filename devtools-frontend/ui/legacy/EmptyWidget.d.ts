import { VBox } from './Widget.js';
export declare class EmptyWidget extends VBox {
    private textElement;
    constructor(text: string);
    appendParagraph(): Element;
    appendLink(link: string): HTMLElement;
    set text(text: string);
}
