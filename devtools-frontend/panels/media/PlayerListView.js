// Copyright 2019 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as i18n from '../../core/i18n/i18n.js';
import * as UI from '../../ui/legacy/legacy.js';
import playerListViewStyles from './playerListView.css.js';
const UIStrings = {
    /**
    *@description A right-click context menu entry which when clicked causes the menu entry for that player to be removed.
    */
    hidePlayer: 'Hide player',
    /**
    *@description A right-click context menu entry which should keep the element selected, while hiding all other entries.
    */
    hideAllOthers: 'Hide all others',
    /**
    *@description Context menu entry which downloads the json dump when clicked
    */
    savePlayerInfo: 'Save player info',
    /**
    *@description Side-panel entry title text for the players section.
    */
    players: 'Players',
};
const str_ = i18n.i18n.registerUIStrings('panels/media/PlayerListView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class PlayerEntryTreeElement extends UI.TreeOutline.TreeElement {
    titleFromUrl;
    playerStatus;
    displayContainer;
    constructor(playerStatus, displayContainer, playerID) {
        super(playerStatus.playerTitle, false);
        this.titleFromUrl = true;
        this.playerStatus = playerStatus;
        this.displayContainer = displayContainer;
        this.setLeadingIcons([UI.Icon.Icon.create('largeicon-play-animation', 'media-player')]);
        this.listItemElement.classList.add('player-entry-tree-element');
        this.listItemElement.addEventListener('contextmenu', this.rightClickContextMenu.bind(this, playerID), false);
    }
    onselect(_selectedByUser) {
        this.displayContainer.renderMainPanel(this.playerStatus.playerID);
        return true;
    }
    rightClickContextMenu(playerID, event) {
        const contextMenu = new UI.ContextMenu.ContextMenu(event);
        contextMenu.headerSection().appendItem(i18nString(UIStrings.hidePlayer), this.hidePlayer.bind(this, playerID));
        contextMenu.headerSection().appendItem(i18nString(UIStrings.hideAllOthers), this.hideOthers.bind(this, playerID));
        contextMenu.headerSection().appendItem(i18nString(UIStrings.savePlayerInfo), this.savePlayer.bind(this, playerID));
        contextMenu.show();
        return true;
    }
    hidePlayer(playerID) {
        this.displayContainer.markPlayerForDeletion(playerID);
    }
    savePlayer(playerID) {
        this.displayContainer.exportPlayerData(playerID);
    }
    hideOthers(playerID) {
        this.displayContainer.markOtherPlayersForDeletion(playerID);
    }
}
export class PlayerListView extends UI.Widget.VBox {
    playerStatuses;
    mainContainer;
    sidebarTree;
    playerList;
    constructor(mainContainer) {
        super(true);
        this.playerStatuses = new Map();
        // Container where new panels can be added based on clicks.
        this.mainContainer = mainContainer;
        // The parent tree for storing sections
        this.sidebarTree = new UI.TreeOutline.TreeOutlineInShadow();
        this.contentElement.appendChild(this.sidebarTree.element);
        // Players active in this tab.
        this.playerList = this.addListSection(i18nString(UIStrings.players));
        this.playerList.listItemElement.classList.add('player-entry-header');
    }
    deletePlayer(playerID) {
        this.playerList.removeChild(this.playerStatuses.get(playerID));
        this.playerStatuses.delete(playerID);
    }
    addListSection(title) {
        const treeElement = new UI.TreeOutline.TreeElement(title, true);
        treeElement.listItemElement.classList.add('storage-group-list-item');
        treeElement.setCollapsible(false);
        treeElement.selectable = false;
        this.sidebarTree.appendChild(treeElement);
        return treeElement;
    }
    addMediaElementItem(playerID) {
        const playerStatus = { playerTitle: playerID, playerID: playerID, exists: true, playing: false, titleEdited: false };
        const playerElement = new PlayerEntryTreeElement(playerStatus, this.mainContainer, playerID);
        this.playerStatuses.set(playerID, playerElement);
        this.playerList.appendChild(playerElement);
    }
    setMediaElementPlayerTitle(playerID, newTitle, isTitleExtractedFromUrl) {
        if (this.playerStatuses.has(playerID)) {
            const sidebarEntry = this.playerStatuses.get(playerID);
            if (sidebarEntry && (!isTitleExtractedFromUrl || sidebarEntry.titleFromUrl)) {
                sidebarEntry.title = newTitle;
                sidebarEntry.titleFromUrl = isTitleExtractedFromUrl;
            }
        }
    }
    setMediaElementPlayerIcon(playerID, iconName) {
        if (this.playerStatuses.has(playerID)) {
            const sidebarEntry = this.playerStatuses.get(playerID);
            if (!sidebarEntry) {
                throw new Error('sidebarEntry is expected to not be null');
            }
            sidebarEntry.setLeadingIcons([UI.Icon.Icon.create(iconName, 'media-player')]);
        }
    }
    onProperty(playerID, property) {
        // Sometimes the title will be an empty string, since this is provided
        // by the website. We don't want to swap title to an empty string.
        if (property.name === "kFrameTitle" /* FrameTitle */ && property.value) {
            this.setMediaElementPlayerTitle(playerID, property.value, false);
        }
        // Url always has a value.
        if (property.name === "kFrameUrl" /* FrameUrl */) {
            const urlPathComponent = property.value.substring(property.value.lastIndexOf('/') + 1);
            this.setMediaElementPlayerTitle(playerID, urlPathComponent, true);
        }
    }
    onError(_playerID, _error) {
        // TODO(tmathmeyer) show an error icon next to the player name
    }
    onMessage(_playerID, _message) {
        // TODO(tmathmeyer) show a message count number next to the player name.
    }
    onEvent(playerID, event) {
        const eventType = JSON.parse(event.value).event;
        if (eventType === 'kPlay') {
            this.setMediaElementPlayerIcon(playerID, 'largeicon-play-animation');
        }
        else if (eventType === 'kPause') {
            this.setMediaElementPlayerIcon(playerID, 'largeicon-pause-animation');
        }
        else if (eventType === 'kWebMediaPlayerDestroyed') {
            this.setMediaElementPlayerIcon(playerID, 'smallicon-videoplayer-destroyed');
        }
    }
    wasShown() {
        super.wasShown();
        this.sidebarTree.registerCSSFiles([playerListViewStyles]);
    }
}
//# sourceMappingURL=PlayerListView.js.map