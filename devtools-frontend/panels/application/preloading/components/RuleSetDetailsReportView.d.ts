import * as Protocol from '../../../../generated/protocol.js';
import * as LegacyWrapper from '../../../../ui/components/legacy_wrapper/legacy_wrapper.js';
import type * as UI from '../../../../ui/legacy/legacy.js';
type RuleSet = Protocol.Preload.RuleSet;
export type RuleSetDetailsReportViewData = RuleSet | null;
export declare class RuleSetDetailsReportView extends LegacyWrapper.LegacyWrapper.WrappableComponent<UI.Widget.VBox> {
    #private;
    static readonly litTagName: import("../../../../ui/lit-html/static.js").Static;
    connectedCallback(): void;
    set data(data: RuleSetDetailsReportViewData);
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-rulesets-details-report-view': RuleSetDetailsReportView;
    }
}
export {};
