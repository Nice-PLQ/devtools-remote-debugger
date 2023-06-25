import * as UI from '../../ui/legacy/legacy.js';
export declare class DeveloperResourcesView extends UI.ThrottledWidget.ThrottledWidget {
    private textFilterRegExp;
    private readonly filterInput;
    private readonly coverageResultsElement;
    private listView;
    private readonly statusToolbarElement;
    private statusMessageElement;
    private readonly loader;
    constructor();
    doUpdate(): Promise<void>;
    private updateStats;
    private isVisible;
    private onFilterChanged;
    wasShown(): void;
}
