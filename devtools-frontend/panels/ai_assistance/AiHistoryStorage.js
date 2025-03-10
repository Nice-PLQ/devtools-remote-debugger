// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../core/common/common.js';
const MAX_TITLE_LENGTH = 80;
export const NOT_FOUND_IMAGE_DATA = '';
export class Conversation {
    id;
    type;
    #isReadOnly;
    history;
    constructor(type, data = [], id = crypto.randomUUID(), isReadOnly = true) {
        this.type = type;
        this.id = id;
        this.#isReadOnly = isReadOnly;
        this.history = this.#reconstructHistory(data);
    }
    get isReadOnly() {
        return this.#isReadOnly;
    }
    get title() {
        const query = this.history.find(response => response.type === "user-query" /* ResponseType.USER_QUERY */)?.query;
        if (!query) {
            return;
        }
        return `${query.substring(0, MAX_TITLE_LENGTH)}${query.length > MAX_TITLE_LENGTH ? '…' : ''}`;
    }
    get isEmpty() {
        return this.history.length === 0;
    }
    #reconstructHistory(historyWithoutImages) {
        const imageHistory = AiHistoryStorage.instance().getImageHistory();
        if (imageHistory && imageHistory.length > 0) {
            const history = [];
            for (const data of historyWithoutImages) {
                if (data.type === "user-query" /* ResponseType.USER_QUERY */ && data.imageId) {
                    const image = imageHistory.find(item => item.id === data.imageId);
                    const inlineData = image ? { data: image.data, mimeType: image.mimeType } :
                        { data: NOT_FOUND_IMAGE_DATA, mimeType: 'image/jpeg' };
                    history.push({ ...data, imageInput: { inlineData } });
                }
                else {
                    history.push(data);
                }
            }
            return history;
        }
        return historyWithoutImages;
    }
    archiveConversation() {
        this.#isReadOnly = true;
    }
    async addHistoryItem(item) {
        if (item.type === "user-query" /* ResponseType.USER_QUERY */) {
            if (item.imageId && item.imageInput && 'inlineData' in item.imageInput) {
                const inlineData = item.imageInput.inlineData;
                await AiHistoryStorage.instance().upsertImage({ id: item.imageId, data: inlineData.data, mimeType: inlineData.mimeType });
            }
        }
        this.history.push(item);
        await AiHistoryStorage.instance().upsertHistoryEntry(this.serialize());
    }
    serialize() {
        return {
            id: this.id,
            history: this.history.map(item => {
                if (item.type === "user-query" /* ResponseType.USER_QUERY */) {
                    return { ...item, imageInput: undefined };
                }
                return item;
            }),
            type: this.type,
        };
    }
}
let instance = null;
const DEFAULT_MAX_STORAGE_SIZE = 50 * 1024 * 1024;
export class AiHistoryStorage {
    #historySetting;
    #imageHistorySettings;
    #mutex = new Common.Mutex.Mutex();
    #maxStorageSize;
    constructor(maxStorageSize = DEFAULT_MAX_STORAGE_SIZE) {
        // This should not throw as we should be creating the setting in the `-meta.ts` file
        this.#historySetting = Common.Settings.Settings.instance().createSetting('ai-assistance-history-entries', []);
        this.#imageHistorySettings = Common.Settings.Settings.instance().createSetting('ai-assistance-history-images', []);
        this.#maxStorageSize = maxStorageSize;
    }
    clearForTest() {
        this.#historySetting.set([]);
        this.#imageHistorySettings.set([]);
    }
    async upsertHistoryEntry(agentEntry) {
        const release = await this.#mutex.acquire();
        try {
            const history = structuredClone(await this.#historySetting.forceGet());
            const historyEntryIndex = history.findIndex(entry => entry.id === agentEntry.id);
            if (historyEntryIndex !== -1) {
                history[historyEntryIndex] = agentEntry;
            }
            else {
                history.push(agentEntry);
            }
            this.#historySetting.set(history);
        }
        finally {
            release();
        }
    }
    async upsertImage(image) {
        const release = await this.#mutex.acquire();
        try {
            const imageHistory = structuredClone(await this.#imageHistorySettings.forceGet());
            const imageHistoryEntryIndex = imageHistory.findIndex(entry => entry.id === image.id);
            if (imageHistoryEntryIndex !== -1) {
                imageHistory[imageHistoryEntryIndex] = image;
            }
            else {
                imageHistory.push(image);
            }
            const imagesToBeStored = [];
            let currentStorageSize = 0;
            for (const [, serializedImage] of Array
                .from(imageHistory.entries())
                .reverse()) {
                if (currentStorageSize >= this.#maxStorageSize) {
                    break;
                }
                currentStorageSize += serializedImage.data.length;
                imagesToBeStored.push(serializedImage);
            }
            this.#imageHistorySettings.set(imagesToBeStored.reverse());
        }
        finally {
            release();
        }
    }
    async deleteHistoryEntry(id) {
        const release = await this.#mutex.acquire();
        try {
            const history = structuredClone(await this.#historySetting.forceGet());
            const imageIdsForDeletion = history.find(entry => entry.id === id)
                ?.history
                .map(item => {
                if (item.type === "user-query" /* ResponseType.USER_QUERY */ && item.imageId) {
                    return item.imageId;
                }
                return undefined;
            })
                .filter(item => Boolean(item));
            this.#historySetting.set(history.filter(entry => entry.id !== id));
            const images = structuredClone(await this.#imageHistorySettings.forceGet());
            this.#imageHistorySettings.set(
            // Filter images for which ids are not present in deletion list
            images.filter(entry => !Boolean(imageIdsForDeletion?.find(id => id === entry.id))));
        }
        finally {
            release();
        }
    }
    async deleteAll() {
        const release = await this.#mutex.acquire();
        try {
            this.#historySetting.set([]);
            this.#imageHistorySettings.set([]);
        }
        finally {
            release();
        }
    }
    getHistory() {
        return structuredClone(this.#historySetting.get());
    }
    getImageHistory() {
        return structuredClone(this.#imageHistorySettings.get());
    }
    static instance(opts = { forceNew: false, maxStorageSize: DEFAULT_MAX_STORAGE_SIZE }) {
        const { forceNew, maxStorageSize } = opts;
        if (!instance || forceNew) {
            instance = new AiHistoryStorage(maxStorageSize);
        }
        return instance;
    }
}
//# sourceMappingURL=AiHistoryStorage.js.map