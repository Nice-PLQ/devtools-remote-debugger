import * as UI from '../../ui/legacy/legacy.js';
import type * as Protocol from '../../generated/protocol.js';
import type { MainView, TriggerDispatcher } from './MainView.js';
import type { PlayerEvent } from './MediaModel.js';
export interface PlayerStatus {
    playerTitle: string;
    playerID: string;
    exists: boolean;
    playing: boolean;
    titleEdited: boolean;
}
export interface PlayerStatusMapElement {
    playerStatus: PlayerStatus;
    playerTitleElement: HTMLElement | null;
}
export declare class PlayerEntryTreeElement extends UI.TreeOutline.TreeElement {
    titleFromUrl: boolean;
    private readonly playerStatus;
    private readonly displayContainer;
    constructor(playerStatus: PlayerStatus, displayContainer: MainView, playerID: string);
    onselect(_selectedByUser?: boolean): boolean;
    private rightClickContextMenu;
    private hidePlayer;
    private savePlayer;
    private hideOthers;
}
export declare class PlayerListView extends UI.Widget.VBox implements TriggerDispatcher {
    private readonly playerStatuses;
    private readonly mainContainer;
    private readonly sidebarTree;
    private readonly playerList;
    constructor(mainContainer: MainView);
    deletePlayer(playerID: string): void;
    private addListSection;
    addMediaElementItem(playerID: string): void;
    setMediaElementPlayerTitle(playerID: string, newTitle: string, isTitleExtractedFromUrl: boolean): void;
    setMediaElementPlayerIcon(playerID: string, iconName: string): void;
    onProperty(playerID: string, property: Protocol.Media.PlayerProperty): void;
    onError(_playerID: string, _error: Protocol.Media.PlayerError): void;
    onMessage(_playerID: string, _message: Protocol.Media.PlayerMessage): void;
    onEvent(playerID: string, event: PlayerEvent): void;
    wasShown(): void;
}
