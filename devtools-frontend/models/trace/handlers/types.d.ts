import type * as ModelHandlers from './ModelHandlers.js';
export interface TraceEventHandler {
    reset(): void;
    initialize?(freshRecording?: boolean): void;
    handleEvent(data: {}): void;
    finalize?(): Promise<void>;
    data(): unknown;
    deps?(): TraceEventHandlerName[];
}
export type TraceEventHandlerName = keyof typeof ModelHandlers;
export type EnabledHandlerDataWithMeta<T extends {
    [key: string]: TraceEventHandler;
}> = {
    Meta: Readonly<ReturnType<typeof ModelHandlers['Meta']['data']>>;
} & {
    [K in keyof T]: Readonly<ReturnType<T[K]['data']>>;
};
export type HandlersWithMeta<T extends {
    [key: string]: TraceEventHandler;
}> = {
    Meta: typeof ModelHandlers.Meta;
} & {
    [K in keyof T]: T[K];
};
export type TraceParseData = Readonly<EnabledHandlerDataWithMeta<typeof ModelHandlers>>;
export type Handlers = typeof ModelHandlers;
export declare const enum HandlerState {
    UNINITIALIZED = 1,
    INITIALIZED = 2,
    FINALIZED = 3
}
export declare const enum EventCategory {
    Parse = "Parse",
    V8 = "V8",
    Js = "Js",
    Gc = "Gc",
    Layout = "Layout",
    Paint = "Paint",
    Load = "Load",
    Other = "Other"
}
export declare const enum KnownEventName {
    Program = "Program",
    RunTask = "RunTask",
    AsyncTask = "AsyncTask",
    XHRLoad = "XHRLoad",
    XHRReadyStateChange = "XHRReadyStateChange",
    ParseHTML = "ParseHTML",
    ParseCSS = "ParseAuthorStyleSheet",
    CompileScript = "V8.CompileScript",
    CompileCode = "V8.CompileCode",
    CompileModule = "V8.CompileModule",
    Optimize = "V8.OptimizeCode",
    WasmStreamFromResponseCallback = "v8.wasm.streamFromResponseCallback",
    WasmCompiledModule = "v8.wasm.compiledModule",
    WasmCachedModule = "v8.wasm.cachedModule",
    WasmModuleCacheHit = "v8.wasm.moduleCacheHit",
    WasmModuleCacheInvalid = "v8.wasm.moduleCacheInvalid",
    RunMicrotasks = "RunMicrotasks",
    EvaluateScript = "EvaluateScript",
    FunctionCall = "FunctionCall",
    EventDispatch = "EventDispatch",
    RequestMainThreadFrame = "RequestMainThreadFrame",
    RequestAnimationFrame = "RequestAnimationFrame",
    CancelAnimationFrame = "CancelAnimationFrame",
    FireAnimationFrame = "FireAnimationFrame",
    RequestIdleCallback = "RequestIdleCallback",
    CancelIdleCallback = "CancelIdleCallback",
    FireIdleCallback = "FireIdleCallback",
    TimerInstall = "TimerInstall",
    TimerRemove = "TimerRemove",
    TimerFire = "TimerFire",
    WebSocketCreate = "WebSocketCreate",
    WebSocketSendHandshake = "WebSocketSendHandshakeRequest",
    WebSocketReceiveHandshake = "WebSocketReceiveHandshakeResponse",
    WebSocketDestroy = "WebSocketDestroy",
    CryptoDoEncrypt = "DoEncrypt",
    CryptoDoEncryptReply = "DoEncryptReply",
    CryptoDoDecrypt = "DoDecrypt",
    CryptoDoDecryptReply = "DoDecryptReply",
    CryptoDoDigest = "DoDigest",
    CryptoDoDigestReply = "DoDigestReply",
    CryptoDoSign = "DoSign",
    CryptoDoSignReply = "DoSignReply",
    CryptoDoVerify = "DoVerify",
    CryptoDoVerifyReply = "DoVerifyReply",
    GC = "GCEvent",
    DOMGC = "BlinkGC.AtomicPhase",
    IncrementalGCMarking = "V8.GCIncrementalMarking",
    MajorGC = "MajorGC",
    MinorGC = "MinorGC",
    ScheduleStyleRecalculation = "ScheduleStyleRecalculation",
    RecalculateStyles = "RecalculateStyles",
    Layout = "Layout",
    UpdateLayoutTree = "UpdateLayoutTree",
    InvalidateLayout = "InvalidateLayout",
    LayoutInvalidationTracking = "LayoutInvalidationTracking",
    ComputeIntersections = "ComputeIntersections",
    HitTest = "HitTest",
    PrePaint = "PrePaint",
    ScrollLayer = "ScrollLayer",
    UpdateLayer = "UpdateLayer",
    PaintSetup = "PaintSetup",
    Paint = "Paint",
    PaintImage = "PaintImage",
    Commit = "Commit",
    CompositeLayers = "CompositeLayers",
    RasterTask = "RasterTask",
    ImageDecodeTask = "ImageDecodeTask",
    ImageUploadTask = "ImageUploadTask",
    DecodeImage = "Decode Image",
    ResizeImage = "Resize Image",
    DrawLazyPixelRef = "Draw LazyPixelRef",
    DecodeLazyPixelRef = "Decode LazyPixelRef",
    GPUTask = "GPUTask"
}
export declare const KNOWN_EVENTS: Map<KnownEventName, {
    category: EventCategory;
    label: string;
}>;
