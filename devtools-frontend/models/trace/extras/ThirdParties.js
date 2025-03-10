// Copyright 2024 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as ThirdPartyWeb from '../../../third_party/third-party-web/third-party-web.js';
import * as Handlers from '../handlers/handlers.js';
import * as Helpers from '../helpers/helpers.js';
import * as Types from '../types/types.js';
function getOrMakeSummaryByEntity(thirdPartySummary, event, url) {
    const entity = ThirdPartyWeb.ThirdPartyWeb.getEntity(url) ??
        Handlers.Helpers.makeUpEntity(thirdPartySummary.madeUpEntityCache, url);
    if (!entity) {
        return null;
    }
    const urls = thirdPartySummary.urlsByEntity.get(entity) ?? new Set();
    urls.add(url);
    thirdPartySummary.urlsByEntity.set(entity, urls);
    const events = thirdPartySummary.eventsByEntity.get(entity) ?? [];
    events.push(event);
    thirdPartySummary.eventsByEntity.set(entity, events);
    let summary = thirdPartySummary.byEntity.get(entity);
    if (summary) {
        return summary;
    }
    summary = { transferSize: 0, mainThreadTime: Types.Timing.Micro(0) };
    thirdPartySummary.byEntity.set(entity, summary);
    return summary;
}
function getOrMakeSummaryByURL(thirdPartySummary, url) {
    let summary = thirdPartySummary.byUrl.get(url);
    if (summary) {
        return summary;
    }
    summary = { transferSize: 0, mainThreadTime: Types.Timing.Micro(0) };
    thirdPartySummary.byUrl.set(url, summary);
    return summary;
}
// TODO: Remove and use the the BottomUpRootNode defined in ThirdPartyTreeView instead.
function collectMainThreadActivity(thirdPartySummary, parsedTrace, bounds) {
    for (const process of parsedTrace.Renderer.processes.values()) {
        if (!process.isOnMainFrame) {
            continue;
        }
        for (const thread of process.threads.values()) {
            if (thread.name === 'CrRendererMain') {
                if (!thread.tree) {
                    break;
                }
                for (const event of thread.entries) {
                    if (!Helpers.Timing.eventIsInBounds(event, bounds)) {
                        continue;
                    }
                    const node = parsedTrace.Renderer.entryToNode.get(event);
                    if (!node || !node.selfTime) {
                        continue;
                    }
                    const url = Handlers.Helpers.getNonResolvedURL(event, parsedTrace);
                    if (!url) {
                        continue;
                    }
                    let summary = getOrMakeSummaryByEntity(thirdPartySummary, event, url);
                    if (summary) {
                        summary.mainThreadTime = (summary.mainThreadTime + node.selfTime);
                    }
                    summary = getOrMakeSummaryByURL(thirdPartySummary, url);
                    if (summary) {
                        summary.mainThreadTime = (summary.mainThreadTime + node.selfTime);
                    }
                }
            }
        }
    }
}
function collectNetworkActivity(thirdPartySummary, requests) {
    for (const request of requests) {
        const url = request.args.data.url;
        let summary = getOrMakeSummaryByEntity(thirdPartySummary, request, url);
        if (summary) {
            summary.transferSize += request.args.data.encodedDataLength;
        }
        summary = getOrMakeSummaryByURL(thirdPartySummary, url);
        if (summary) {
            summary.transferSize += request.args.data.encodedDataLength;
        }
    }
}
/**
 * @param networkRequests Won't be filtered by trace bounds, so callers should ensure it is filtered.
 */
export function summarizeThirdParties(parsedTrace, traceBounds, networkRequests) {
    const thirdPartySummary = {
        byEntity: new Map(),
        byUrl: new Map(),
        urlsByEntity: new Map(),
        eventsByEntity: new Map(),
        madeUpEntityCache: new Map(),
    };
    collectMainThreadActivity(thirdPartySummary, parsedTrace, traceBounds);
    collectNetworkActivity(thirdPartySummary, networkRequests);
    return thirdPartySummary;
}
function getSummaryMapWithMapping(events, entityByEvent, eventsByEntity) {
    const byEvent = new Map();
    const byEntity = new Map();
    const defaultSummary = { transferSize: 0, mainThreadTime: Types.Timing.Micro(0) };
    for (const event of events) {
        const urlSummary = byEvent.get(event) || { ...defaultSummary };
        if (Types.Events.isSyntheticNetworkRequest(event)) {
            urlSummary.transferSize += event.args.data.encodedDataLength;
        }
        byEvent.set(event, urlSummary);
    }
    // Map each request's stat to a particular entity.
    for (const [request, requestSummary] of byEvent.entries()) {
        const entity = entityByEvent.get(request);
        if (!entity) {
            byEvent.delete(request);
            continue;
        }
        const entitySummary = byEntity.get(entity) || { ...defaultSummary };
        entitySummary.transferSize += requestSummary.transferSize;
        byEntity.set(entity, entitySummary);
    }
    return { byEntity, eventsByEntity, madeUpEntityCache: new Map(), byUrl: new Map(), urlsByEntity: new Map() };
}
// TODO(crbug.com/352244718): Remove or refactor to use summarizeThirdParties/collectMainThreadActivity/etc.
/**
 * Note: unlike summarizeThirdParties, this does not calculate mainThreadTime. The reason is that it is not
 * needed for its one use case, and when dragging the trace bounds it takes a long time to calculate.
 * If it is ever needed, we need to make getSelfTimeByUrl (see deleted code/blame) much faster (cache + bucket?).
 */
export function getSummariesAndEntitiesWithMapping(parsedTrace, traceBounds, entityMapping) {
    const entityByEvent = new Map(entityMapping.entityByEvent);
    const eventsByEntity = new Map(entityMapping.eventsByEntity);
    // Consider events only in bounds.
    const entityByEventArr = Array.from(entityByEvent.entries());
    const filteredEntries = entityByEventArr.filter(([event]) => {
        return Helpers.Timing.eventIsInBounds(event, traceBounds);
    });
    const entityByEventFiltered = new Map(filteredEntries);
    // Consider events only in bounds.
    const eventsByEntityArr = Array.from(eventsByEntity.entries());
    const filtered = eventsByEntityArr.filter(([, events]) => {
        events.map(event => {
            return Helpers.Timing.eventIsInBounds(event, traceBounds);
        });
        return events.length > 0;
    });
    const eventsByEntityFiltered = new Map(filtered);
    const allEvents = Array.from(entityByEvent.keys());
    const summaries = getSummaryMapWithMapping(allEvents, entityByEventFiltered, eventsByEntityFiltered);
    return { summaries, entityByEvent: entityByEventFiltered };
}
//# sourceMappingURL=ThirdParties.js.map