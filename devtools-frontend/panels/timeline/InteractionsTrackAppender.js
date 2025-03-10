import * as i18n from '../../core/i18n/i18n.js';
import * as Trace from '../../models/trace/trace.js';
import * as PerfUI from '../../ui/legacy/components/perf_ui/perf_ui.js';
import { buildGroupStyle, buildTrackHeader } from './AppenderUtils.js';
import * as Components from './components/components.js';
import * as Utils from './utils/utils.js';
const UIStrings = {
    /**
     *@description Text in Timeline Flame Chart Data Provider of the Performance panel
     */
    interactions: 'Interactions',
};
const str_ = i18n.i18n.registerUIStrings('panels/timeline/InteractionsTrackAppender.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class InteractionsTrackAppender {
    appenderName = 'Interactions';
    #colorGenerator;
    #compatibilityBuilder;
    #parsedTrace;
    constructor(compatibilityBuilder, parsedTrace, colorGenerator) {
        this.#compatibilityBuilder = compatibilityBuilder;
        this.#colorGenerator = colorGenerator;
        this.#parsedTrace = parsedTrace;
    }
    /**
     * Appends into the flame chart data the data corresponding to the
     * interactions track.
     * @param trackStartLevel the horizontal level of the flame chart events where
     * the track's events will start being appended.
     * @param expanded wether the track should be rendered expanded.
     * @returns the first available level to append more data after having
     * appended the track's events.
     */
    appendTrackAtLevel(trackStartLevel, expanded) {
        if (this.#parsedTrace.UserInteractions.interactionEvents.length === 0) {
            return trackStartLevel;
        }
        this.#appendTrackHeaderAtLevel(trackStartLevel, expanded);
        return this.#appendInteractionsAtLevel(trackStartLevel);
    }
    /**
     * Adds into the flame chart data the header corresponding to the
     * interactions track. A header is added in the shape of a group in the
     * flame chart data. A group has a predefined style and a reference
     * to the definition of the legacy track (which should be removed
     * in the future).
     * @param currentLevel the flame chart level at which the header is
     * appended.
     */
    #appendTrackHeaderAtLevel(currentLevel, expanded) {
        const trackIsCollapsible = this.#parsedTrace.UserInteractions.interactionEvents.length > 0;
        const style = buildGroupStyle({ collapsible: trackIsCollapsible, useDecoratorsForOverview: true });
        const group = buildTrackHeader("interactions" /* VisualLoggingTrackName.INTERACTIONS */, currentLevel, i18nString(UIStrings.interactions), style, 
        /* selectable= */ true, expanded);
        this.#compatibilityBuilder.registerTrackForGroup(group, this);
    }
    /**
     * Adds into the flame chart data the trace events dispatched by the
     * performance.measure API. These events are taken from the UserInteractions
     * handler.
     * @param currentLevel the flame chart level from which interactions will
     * be appended.
     * @returns the next level after the last occupied by the appended
     * interactions (the first available level to append more data).
     */
    #appendInteractionsAtLevel(trackStartLevel) {
        const { interactionEventsWithNoNesting, interactionsOverThreshold } = this.#parsedTrace.UserInteractions;
        const addCandyStripeToLongInteraction = (event, index) => {
            // Each interaction that we drew that is over the INP threshold needs to be
            // candy-striped.
            const overThreshold = interactionsOverThreshold.has(event);
            if (!overThreshold) {
                return;
            }
            if (index !== undefined) {
                this.#addCandyStripeAndWarningForLongInteraction(event, index);
            }
        };
        // Render all top level interactions (see UserInteractionsHandler for an explanation on the nesting) onto the track.
        const newLevel = this.#compatibilityBuilder.appendEventsAtLevel(interactionEventsWithNoNesting, trackStartLevel, this, addCandyStripeToLongInteraction);
        return newLevel;
    }
    #addCandyStripeAndWarningForLongInteraction(entry, eventIndex) {
        const decorationsForEvent = this.#compatibilityBuilder.getFlameChartTimelineData().entryDecorations[eventIndex] || [];
        decorationsForEvent.push({
            type: "CANDY" /* PerfUI.FlameChart.FlameChartDecorationType.CANDY */,
            startAtTime: Trace.Handlers.ModelHandlers.UserInteractions.LONG_INTERACTION_THRESHOLD,
            // Interaction events have whiskers, so we do not want to candy stripe
            // the entire duration. The box represents processing duration, so we only
            // candystripe up to the end of processing.
            endAtTime: entry.processingEnd,
        }, {
            type: "WARNING_TRIANGLE" /* PerfUI.FlameChart.FlameChartDecorationType.WARNING_TRIANGLE */,
            customEndTime: entry.processingEnd,
        });
        this.#compatibilityBuilder.getFlameChartTimelineData().entryDecorations[eventIndex] = decorationsForEvent;
    }
    /*
      ------------------------------------------------------------------------------------
       The following methods  are invoked by the flame chart renderer to query features about
       events on rendering.
      ------------------------------------------------------------------------------------
    */
    /**
     * Gets the color an event added by this appender should be rendered with.
     */
    colorForEvent(event) {
        let idForColorGeneration = Utils.EntryName.nameForEntry(event, this.#parsedTrace);
        if (Trace.Types.Events.isSyntheticInteraction(event)) {
            // Append the ID so that we vary the colours, ensuring that two events of
            // the same type are coloured differently.
            idForColorGeneration += event.interactionId;
        }
        return this.#colorGenerator.colorForID(idForColorGeneration);
    }
    setPopoverInfo(event, info) {
        if (Trace.Types.Events.isSyntheticInteraction(event)) {
            const breakdown = new Components.InteractionBreakdown.InteractionBreakdown();
            breakdown.entry = event;
            info.additionalElements.push(breakdown);
        }
    }
}
//# sourceMappingURL=InteractionsTrackAppender.js.map