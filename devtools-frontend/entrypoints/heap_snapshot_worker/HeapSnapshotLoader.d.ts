import { JSHeapSnapshot } from './HeapSnapshot.js';
import type { HeapSnapshotWorkerDispatcher } from './HeapSnapshotWorkerDispatcher.js';
export declare class HeapSnapshotLoader {
    private readonly progress;
    private buffer;
    private dataCallback;
    private done;
    private snapshot?;
    private array;
    private arrayIndex;
    private json?;
    private jsonTokenizer?;
    constructor(dispatcher: HeapSnapshotWorkerDispatcher);
    dispose(): void;
    private reset;
    close(): void;
    buildSnapshot(): JSHeapSnapshot;
    private parseUintArray;
    private parseStringsArray;
    write(chunk: string): void;
    private fetchChunk;
    private findToken;
    private parseArray;
    private parseInput;
}
