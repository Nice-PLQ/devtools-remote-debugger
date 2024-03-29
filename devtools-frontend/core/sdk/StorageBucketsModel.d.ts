import type * as Protocol from '../../generated/protocol.js';
import type * as ProtocolProxyApi from '../../generated/protocol-proxy-api.js';
import { type Target } from './Target.js';
import { SDKModel } from './SDKModel.js';
export declare class StorageBucketsModel extends SDKModel<EventTypes> implements ProtocolProxyApi.StorageDispatcher {
    private enabled;
    readonly storageAgent: ProtocolProxyApi.StorageApi;
    private readonly storageKeyManager;
    private bucketsById;
    private trackedStorageKeys;
    constructor(target: Target);
    getBuckets(): Set<Protocol.Storage.StorageBucketInfo>;
    getBucketsForStorageKey(storageKey: string): Set<Protocol.Storage.StorageBucketInfo>;
    getDefaultBucketForStorageKey(storageKey: string): Protocol.Storage.StorageBucketInfo | null;
    getBucketById(bucketId: string): Protocol.Storage.StorageBucketInfo | null;
    getBucketByName(storageKey: string, bucketName?: string): Protocol.Storage.StorageBucketInfo | null;
    deleteBucket(bucket: Protocol.Storage.StorageBucket): void;
    enable(): void;
    private storageKeyAdded;
    private storageKeyRemoved;
    private addStorageKey;
    private removeStorageKey;
    private bucketAdded;
    private bucketRemoved;
    private bucketChanged;
    private bucketInfosAreEqual;
    storageBucketCreatedOrUpdated({ bucketInfo }: Protocol.Storage.StorageBucketCreatedOrUpdatedEvent): void;
    storageBucketDeleted({ bucketId }: Protocol.Storage.StorageBucketDeletedEvent): void;
    interestGroupAccessed(_event: Protocol.Storage.InterestGroupAccessedEvent): void;
    indexedDBListUpdated(_event: Protocol.Storage.IndexedDBListUpdatedEvent): void;
    indexedDBContentUpdated(_event: Protocol.Storage.IndexedDBContentUpdatedEvent): void;
    cacheStorageListUpdated(_event: Protocol.Storage.CacheStorageListUpdatedEvent): void;
    cacheStorageContentUpdated(_event: Protocol.Storage.CacheStorageContentUpdatedEvent): void;
    sharedStorageAccessed(_event: Protocol.Storage.SharedStorageAccessedEvent): void;
}
export declare const enum Events {
    BucketAdded = "BucketAdded",
    BucketRemoved = "BucketRemoved",
    BucketChanged = "BucketChanged"
}
export interface BucketEvent {
    model: StorageBucketsModel;
    bucketInfo: Protocol.Storage.StorageBucketInfo;
}
export type EventTypes = {
    [Events.BucketAdded]: BucketEvent;
    [Events.BucketRemoved]: BucketEvent;
    [Events.BucketChanged]: BucketEvent;
};
