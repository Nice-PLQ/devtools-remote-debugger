// Important: we purposefully treat `potentially_blocking` as
// non-render-blocking here because:
// 1. An async script can run on the main thread at any point, including before
//    the page is loaded
// 2. An async script will never block the parsing and rendering process of the
//    browser.
// 3. Therefore, from a developer's point of view, there is nothing more they
//    can do if they've put `async` on, and within the context of Insights, we
//    shouldn't report an async script as render blocking.
// In the future we may want to consider suggesting the use of `defer` over
// `async`, as it doesn't have this concern, but for now we'll allow `async`
// and not report it as an issue.
const NON_RENDER_BLOCKING_VALUES = new Set([
    'non_blocking',
    'dynamically_injected_non_blocking',
    'potentially_blocking',
]);
export function isSyntheticNetworkRequestEventRenderBlocking(event) {
    return !NON_RENDER_BLOCKING_VALUES.has(event.args.data.renderBlocking);
}
const HIGH_NETWORK_PRIORITIES = new Set([
    "VeryHigh" /* Protocol.Network.ResourcePriority.VeryHigh */,
    "High" /* Protocol.Network.ResourcePriority.High */,
    "Medium" /* Protocol.Network.ResourcePriority.Medium */,
]);
export function isSyntheticNetworkRequestHighPriority(event) {
    return HIGH_NETWORK_PRIORITIES.has(event.args.data.priority);
}
//# sourceMappingURL=Network.js.map