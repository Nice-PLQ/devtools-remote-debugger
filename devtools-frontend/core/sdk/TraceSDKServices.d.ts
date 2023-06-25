import type * as TraceEngine from '../../models/trace/trace.js';
import type * as Protocol from '../../generated/protocol.js';
import { type DOMNode } from './DOMModel.js';
export declare function _TEST_clearCache(): void;
/**
 * Looks up the DOM Node on the page for the given BackendNodeId. Uses the
 * provided TraceParseData as the cache and will cache the result after the
 * first lookup.
 */
export declare function domNodeForBackendNodeID(modelData: TraceEngine.Handlers.Types.TraceParseData, nodeId: Protocol.DOM.BackendNodeId): Promise<DOMNode | null>;
/**
 * Takes a set of Protocol.DOM.BackendNodeId ids and will return a map of NodeId=>DOMNode.
 * Results are cached based on 1) the provided TraceParseData and 2) the provided set of IDs.
 */
export declare function domNodesForMultipleBackendNodeIds(modelData: TraceEngine.Handlers.Types.TraceParseData, nodeIds: Set<Protocol.DOM.BackendNodeId>): Promise<Map<Protocol.DOM.BackendNodeId, DOMNode | null>>;
export interface LayoutShiftSource {
    previousRect: DOMRect;
    currentRect: DOMRect;
    node: DOMNode;
}
/**
 * Calculates and returns a list of sources for a LayoutShift.
 * Here, a source is considered as a node that moved and contributed to the
 * given LayoutShift existing and the score it was given. Each source returned
 * contains a reference to the DOM Node, and its dimensions (as a DOMRect), both
 * before and now, so we can see how this node changed and how that impacted the
 * layout shift.
 *
 * This data is cached based on the provided model data and the given layout
 * shift, so it is is safe to call multiple times with the same input.
 */
export declare function sourcesForLayoutShift(modelData: TraceEngine.Handlers.Types.TraceParseData, event: TraceEngine.Types.TraceEvents.TraceEventLayoutShift): Promise<readonly LayoutShiftSource[]>;
/**
 * Takes a LayoutShift and normalizes its node dimensions based on the device
 * pixel ratio (DPR) of the user's display.
 * This is required because the Layout Instability API is not based on CSS
 * pixels, but physical pixels. Therefore we need to map these to normalized CSS
 * pixels if we can. For example, if the user is on a device with a DPR of 2,
 * the values of the node dimensions reported by the Instability API need to be
 * divided by 2 to be accurate.
 * This function is safe to call multiple times as results are cached based on
 * the provided model data.
 * See https://crbug.com/1300309 for details.
 */
export declare function normalizedImpactedNodesForLayoutShift(modelData: TraceEngine.Handlers.Types.TraceParseData, event: TraceEngine.Types.TraceEvents.TraceEventLayoutShift): Promise<readonly TraceEngine.Types.TraceEvents.TraceImpactedNode[]>;
export declare function getMetadataForFreshRecording(recordStartTime?: number): Promise<TraceEngine.TraceModel.TraceFileMetaData | undefined>;
