import type * as Protocol from '../../../generated/protocol.js';
export declare const i18nString: (id: string, values?: import("../../../core/i18n/i18nTypes.js").Values | undefined) => import("../../../core/platform/UIString.js").LocalizedString;
export interface ReportsGridData {
    reports: Protocol.Network.ReportingApiReport[];
}
export declare class ReportsGrid extends HTMLElement {
    static readonly litTagName: import("../../../ui/lit-html/static.js").Static;
    private readonly shadow;
    private reports;
    private protocolMonitorExperimentEnabled;
    connectedCallback(): void;
    set data(data: ReportsGridData);
    private render;
    private buildReportRows;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-resources-reports-grid': ReportsGrid;
    }
}
