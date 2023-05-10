import type * as SDK from '../../../core/sdk/sdk.js';
import * as NetworkForward from '../../../panels/network/forward/forward.js';
import type * as Logs from '../../../models/logs/logs.js';
import * as IconButton from '../../../ui/components/icon_button/icon_button.js';
import type * as Protocol from '../../../generated/protocol.js';
export interface RequestLinkIconData {
    linkToPreflight?: boolean;
    request?: SDK.NetworkRequest.NetworkRequest | null;
    affectedRequest?: {
        requestId: Protocol.Network.RequestId;
        url?: string;
    };
    highlightHeader?: {
        section: NetworkForward.UIRequestLocation.UIHeaderSection;
        name: string;
    };
    networkTab?: NetworkForward.UIRequestLocation.UIRequestTabs;
    requestResolver?: Logs.RequestResolver.RequestResolver;
    displayURL?: boolean;
    additionalOnClickAction?: () => void;
    revealOverride?: (revealable: Object | null, omitFocus?: boolean | undefined) => Promise<void>;
}
export declare const extractShortPath: (path: string) => string;
export declare class RequestLinkIcon extends HTMLElement {
    static readonly litTagName: import("../../lit-html/static.js").Static;
    private readonly shadow;
    private linkToPreflight?;
    private request?;
    private highlightHeader?;
    private requestResolver?;
    private displayURL;
    private networkTab?;
    private affectedRequest?;
    private additionalOnClickAction?;
    private reveal;
    private requestResolvedPromise;
    set data(data: RequestLinkIconData);
    connectedCallback(): void;
    private resolveRequest;
    get data(): RequestLinkIconData;
    private iconColor;
    iconData(): IconButton.Icon.IconData;
    handleClick(event: MouseEvent): void;
    private getTooltip;
    private getUrlForDisplaying;
    private maybeRenderURL;
    private render;
    private renderComponent;
}
declare global {
    interface HTMLElementTagNameMap {
        'devtools-request-link-icon': RequestLinkIcon;
    }
}
