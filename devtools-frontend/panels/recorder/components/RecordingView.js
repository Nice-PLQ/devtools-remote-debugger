// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import '../../../ui/components/icon_button/icon_button.js';
import './ExtensionView.js';
import './ControlButton.js';
import './ReplaySection.js';
import * as Host from '../../../core/host/host.js';
import * as i18n from '../../../core/i18n/i18n.js';
import * as Platform from '../../../core/platform/platform.js';
import * as SDK from '../../../core/sdk/sdk.js';
import * as CodeMirror from '../../../third_party/codemirror.next/codemirror.next.js';
import * as Buttons from '../../../ui/components/buttons/buttons.js';
import * as CodeHighlighter from '../../../ui/components/code_highlighter/code_highlighter.js';
import * as Dialogs from '../../../ui/components/dialogs/dialogs.js';
import * as Input from '../../../ui/components/input/input.js';
import * as TextEditor from '../../../ui/components/text_editor/text_editor.js';
import * as Lit from '../../../ui/lit/lit.js';
import * as VisualLogging from '../../../ui/visual_logging/visual_logging.js';
import * as Models from '../models/models.js';
import recordingViewStylesRaw from './recordingView.css.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const recordingViewStyles = new CSSStyleSheet();
recordingViewStyles.replaceSync(recordingViewStylesRaw.cssContent);
const { html } = Lit;
const UIStrings = {
    /**
     * @description Depicts that the recording was done on a mobile device (e.g., a smartphone or tablet).
     */
    mobile: 'Mobile',
    /**
     * @description Depicts that the recording was done on a desktop device (e.g., on a PC or laptop).
     */
    desktop: 'Desktop',
    /**
     * @description Network latency in milliseconds.
     * @example {10} value
     */
    latency: 'Latency: {value} ms',
    /**
     * @description Upload speed.
     * @example {42 kB} value
     */
    upload: 'Upload: {value}',
    /**
     * @description Download speed.
     * @example {8 kB} value
     */
    download: 'Download: {value}',
    /**
     * @description Title of the button to edit replay settings.
     */
    editReplaySettings: 'Edit replay settings',
    /**
     * @description Title of the section that contains replay settings.
     */
    replaySettings: 'Replay settings',
    /**
     * @description The string is shown when a default value is used for some replay settings.
     */
    default: 'Default',
    /**
     * @description The title of the section with environment settings.
     */
    environment: 'Environment',
    /**
     * @description The title of the screenshot image that is shown for every section in the recordign view.
     */
    screenshotForSection: 'Screenshot for this section',
    /**
     * @description The title of the button that edits the current recording's title.
     */
    editTitle: 'Edit title',
    /**
     * @description The error for when the title is missing.
     */
    requiredTitleError: 'Title is required',
    /**
     * @description The status text that is shown while the recording is ongoing.
     */
    recording: 'Recording…',
    /**
     * @description The title of the button to end the current recording.
     */
    endRecording: 'End recording',
    /**
     * @description The title of the button while the recording is being ended.
     */
    recordingIsBeingStopped: 'Stopping recording…',
    /**
     * @description The text that describes a timeout setting of {value} milliseconds.
     * @example {1000} value
     */
    timeout: 'Timeout: {value} ms',
    /**
     * @description The label for the input that allows entering network throttling configuration.
     */
    network: 'Network',
    /**
     * @description The label for the input that allows entering timeout (a number in ms) configuration.
     */
    timeoutLabel: 'Timeout',
    /**
     * @description The text in a tooltip for the timeout input that explains what timeout settings do.
     */
    timeoutExplanation: 'The timeout setting (in milliseconds) applies to every action when replaying the recording. For example, if a DOM element identified by a CSS selector does not appear on the page within the specified timeout, the replay fails with an error.',
    /**
     * @description The label for the button that cancels replaying.
     */
    cancelReplay: 'Cancel replay',
    /**
     * @description Button title that shows the code view when clicked.
     */
    showCode: 'Show code',
    /**
     * @description Button title that hides the code view when clicked.
     */
    hideCode: 'Hide code',
    /**
     * @description Button title that adds an assertion to the step editor.
     */
    addAssertion: 'Add assertion',
    /**
     * @description The title of the button that open current recording in Performance panel.
     */
    performancePanel: 'Performance panel',
};
const str_ = i18n.i18n.registerUIStrings('panels/recorder/components/RecordingView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class RecordingFinishedEvent extends Event {
    static eventName = 'recordingfinished';
    constructor() {
        super(RecordingFinishedEvent.eventName);
    }
}
export class PlayRecordingEvent extends Event {
    static eventName = 'playrecording';
    data;
    constructor(data = {
        targetPanel: "chrome-recorder" /* TargetPanel.DEFAULT */,
        speed: "normal" /* PlayRecordingSpeed.NORMAL */,
    }) {
        super(PlayRecordingEvent.eventName);
        this.data = data;
    }
}
export class AbortReplayEvent extends Event {
    static eventName = 'abortreplay';
    constructor() {
        super(AbortReplayEvent.eventName);
    }
}
export class RecordingChangedEvent extends Event {
    static eventName = 'recordingchanged';
    data;
    constructor(currentStep, newStep) {
        super(RecordingChangedEvent.eventName);
        this.data = { currentStep, newStep };
    }
}
export class AddAssertionEvent extends Event {
    static eventName = 'addassertion';
    constructor() {
        super(AddAssertionEvent.eventName);
    }
}
export class RecordingTitleChangedEvent extends Event {
    static eventName = 'recordingtitlechanged';
    title;
    constructor(title) {
        super(RecordingTitleChangedEvent.eventName, {});
        this.title = title;
    }
}
export class NetworkConditionsChanged extends Event {
    static eventName = 'networkconditionschanged';
    data;
    constructor(data) {
        super(NetworkConditionsChanged.eventName, {
            composed: true,
            bubbles: true,
        });
        this.data = data;
    }
}
export class TimeoutChanged extends Event {
    static eventName = 'timeoutchanged';
    data;
    constructor(data) {
        super(TimeoutChanged.eventName, { composed: true, bubbles: true });
        this.data = data;
    }
}
const networkConditionPresets = [
    SDK.NetworkManager.NoThrottlingConditions,
    SDK.NetworkManager.OfflineConditions,
    SDK.NetworkManager.Slow3GConditions,
    SDK.NetworkManager.Slow4GConditions,
    SDK.NetworkManager.Fast4GConditions,
];
function converterIdToFlowMetric(converterId) {
    switch (converterId) {
        case "puppeteer" /* Models.ConverterIds.ConverterIds.PUPPETEER */:
        case "puppeteer-firefox" /* Models.ConverterIds.ConverterIds.PUPPETEER_FIREFOX */:
            return 1 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_RECORDING_WITH_PUPPETEER */;
        case "json" /* Models.ConverterIds.ConverterIds.JSON */:
            return 2 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_RECORDING_WITH_JSON */;
        case "@puppeteer/replay" /* Models.ConverterIds.ConverterIds.REPLAY */:
            return 3 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_RECORDING_WITH_REPLAY */;
        default:
            return 4 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_RECORDING_WITH_EXTENSION */;
    }
}
function converterIdToStepMetric(converterId) {
    switch (converterId) {
        case "puppeteer" /* Models.ConverterIds.ConverterIds.PUPPETEER */:
        case "puppeteer-firefox" /* Models.ConverterIds.ConverterIds.PUPPETEER_FIREFOX */:
            return 5 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_STEP_WITH_PUPPETEER */;
        case "json" /* Models.ConverterIds.ConverterIds.JSON */:
            return 6 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_STEP_WITH_JSON */;
        case "@puppeteer/replay" /* Models.ConverterIds.ConverterIds.REPLAY */:
            return 7 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_STEP_WITH_REPLAY */;
        default:
            return 8 /* Host.UserMetrics.RecordingCopiedToClipboard.COPIED_STEP_WITH_EXTENSION */;
    }
}
export class RecordingView extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #replayState = { isPlaying: false, isPausedOnBreakpoint: false };
    #userFlow = null;
    #isRecording = false;
    #recordingTogglingInProgress = false;
    #isTitleInvalid = false;
    #currentStep;
    #steps = [];
    #currentError;
    #sections = [];
    #settings;
    #recorderSettings;
    #lastReplayResult;
    #breakpointIndexes = new Set();
    #selectedStep;
    #replaySettingsExpanded = false;
    #replayAllowed = true;
    #builtInConverters = [];
    #extensionConverters = [];
    #replayExtensions;
    #showCodeView = false;
    #code = '';
    #converterId = '';
    #editorState;
    #sourceMap;
    #extensionDescriptor;
    #onCopyBound = this.#onCopy.bind(this);
    constructor() {
        super();
    }
    set data(data) {
        this.#isRecording = data.isRecording;
        this.#replayState = data.replayState;
        this.#recordingTogglingInProgress = data.recordingTogglingInProgress;
        this.#currentStep = data.currentStep;
        this.#userFlow = data.recording;
        this.#steps = this.#userFlow.steps;
        this.#sections = data.sections;
        this.#settings = data.settings;
        this.#recorderSettings = data.recorderSettings;
        this.#currentError = data.currentError;
        this.#lastReplayResult = data.lastReplayResult;
        this.#replayAllowed = data.replayAllowed;
        this.#isTitleInvalid = false;
        this.#breakpointIndexes = data.breakpointIndexes;
        this.#builtInConverters = data.builtInConverters;
        this.#extensionConverters = data.extensionConverters;
        this.#replayExtensions = data.replayExtensions;
        this.#extensionDescriptor = data.extensionDescriptor;
        this.#converterId = this.#recorderSettings?.preferredCopyFormat ?? data.builtInConverters[0]?.getId();
        void this.#convertToCode();
        this.#render();
    }
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [
            recordingViewStyles,
            Input.textInputStyles,
        ];
        document.addEventListener('copy', this.#onCopyBound);
        this.#render();
    }
    disconnectedCallback() {
        document.removeEventListener('copy', this.#onCopyBound);
    }
    scrollToBottom() {
        const wrapper = this.shadowRoot?.querySelector('.sections');
        if (!wrapper) {
            return;
        }
        wrapper.scrollTop = wrapper.scrollHeight;
    }
    #dispatchAddAssertionEvent() {
        this.dispatchEvent(new AddAssertionEvent());
    }
    #dispatchRecordingFinished() {
        this.dispatchEvent(new RecordingFinishedEvent());
    }
    #handleAbortReplay() {
        this.dispatchEvent(new AbortReplayEvent());
    }
    #handleTogglePlaying(event) {
        this.dispatchEvent(new PlayRecordingEvent({
            targetPanel: "chrome-recorder" /* TargetPanel.DEFAULT */,
            speed: event.speed,
            extension: event.extension,
        }));
    }
    #getStepState(step) {
        if (!this.#currentStep) {
            return "default" /* State.DEFAULT */;
        }
        if (step === this.#currentStep) {
            if (this.#currentError) {
                return "error" /* State.ERROR */;
            }
            if (!this.#replayState.isPlaying) {
                return "success" /* State.SUCCESS */;
            }
            if (this.#replayState.isPausedOnBreakpoint) {
                return "stopped" /* State.STOPPED */;
            }
            return "current" /* State.CURRENT */;
        }
        const currentIndex = this.#steps.indexOf(this.#currentStep);
        if (currentIndex === -1) {
            return "default" /* State.DEFAULT */;
        }
        const index = this.#steps.indexOf(step);
        return index < currentIndex ? "success" /* State.SUCCESS */ : "outstanding" /* State.OUTSTANDING */;
    }
    #getSectionState(section) {
        const currentStep = this.#currentStep;
        if (!currentStep) {
            return "default" /* State.DEFAULT */;
        }
        const currentSection = this.#sections.find(section => section.steps.includes(currentStep));
        if (!currentSection) {
            if (this.#currentError) {
                return "error" /* State.ERROR */;
            }
        }
        if (section === currentSection) {
            return "success" /* State.SUCCESS */;
        }
        const index = this.#sections.indexOf(currentSection);
        const ownIndex = this.#sections.indexOf(section);
        return index >= ownIndex ? "success" /* State.SUCCESS */ : "outstanding" /* State.OUTSTANDING */;
    }
    #renderStep(section, step, isLastSection) {
        const stepIndex = this.#steps.indexOf(step);
        // clang-format off
        return html `
      <devtools-step-view
      @click=${this.#onStepClick}
      @mouseover=${this.#onStepHover}
      @copystep=${this.#onCopyStepEvent}
      .data=${{
            step,
            state: this.#getStepState(step),
            error: this.#currentStep === step ? this.#currentError : undefined,
            isFirstSection: false,
            isLastSection: isLastSection && this.#steps[this.#steps.length - 1] === step,
            isStartOfGroup: false,
            isEndOfGroup: section.steps[section.steps.length - 1] === step,
            stepIndex,
            hasBreakpoint: this.#breakpointIndexes.has(stepIndex),
            sectionIndex: -1,
            isRecording: this.#isRecording,
            isPlaying: this.#replayState.isPlaying,
            removable: this.#steps.length > 1,
            builtInConverters: this.#builtInConverters,
            extensionConverters: this.#extensionConverters,
            isSelected: this.#selectedStep === step,
            recorderSettings: this.#recorderSettings,
        }}
      jslog=${VisualLogging.section('step').track({ click: true })}
      ></devtools-step-view>
    `;
        // clang-format on
    }
    #onStepHover = (event) => {
        const stepView = event.target;
        const step = stepView.step || stepView.section?.causingStep;
        if (!step || this.#selectedStep) {
            return;
        }
        this.#highlightCodeForStep(step);
    };
    #onStepClick(event) {
        event.stopPropagation();
        const stepView = event.target;
        const selectedStep = stepView.step || stepView.section?.causingStep || null;
        if (this.#selectedStep === selectedStep) {
            return;
        }
        this.#selectedStep = selectedStep;
        this.#render();
        if (selectedStep) {
            this.#highlightCodeForStep(selectedStep, /* scroll=*/ true);
        }
    }
    #onWrapperClick() {
        if (this.#selectedStep === undefined) {
            return;
        }
        this.#selectedStep = undefined;
        this.#render();
    }
    #onReplaySettingsKeydown(event) {
        if (event.key !== 'Enter') {
            return;
        }
        event.preventDefault();
        this.#onToggleReplaySettings(event);
    }
    #onToggleReplaySettings(event) {
        event.stopPropagation();
        this.#replaySettingsExpanded = !this.#replaySettingsExpanded;
        this.#render();
    }
    #onNetworkConditionsChange(event) {
        const preset = networkConditionPresets.find(preset => preset.i18nTitleKey === event.itemValue);
        this.dispatchEvent(new NetworkConditionsChanged(preset?.i18nTitleKey === SDK.NetworkManager.NoThrottlingConditions.i18nTitleKey ? undefined : preset));
    }
    #onTimeoutInput(event) {
        const target = event.target;
        if (!target.checkValidity()) {
            target.reportValidity();
            return;
        }
        this.dispatchEvent(new TimeoutChanged(Number(target.value)));
    }
    #onTitleBlur = (event) => {
        const target = event.target;
        const title = target.innerText.trim();
        if (!title) {
            this.#isTitleInvalid = true;
            this.#render();
            return;
        }
        this.dispatchEvent(new RecordingTitleChangedEvent(title));
    };
    #onTitleInputKeyDown = (event) => {
        switch (event.code) {
            case 'Escape':
            case 'Enter':
                event.target.blur();
                event.stopPropagation();
                break;
        }
    };
    #onEditTitleButtonClick = () => {
        const input = this.#shadow.getElementById('title-input');
        input.focus();
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    };
    #onSelectMenuLabelClick = (event) => {
        const target = event.target;
        if (target.matches('.wrapping-label')) {
            target.querySelector('devtools-select-menu')?.click();
        }
    };
    async #copyCurrentSelection(step) {
        let converter = [
            ...this.#builtInConverters,
            ...this.#extensionConverters,
        ]
            .find(converter => converter.getId() === this.#recorderSettings?.preferredCopyFormat);
        if (!converter) {
            converter = this.#builtInConverters[0];
        }
        if (!converter) {
            throw new Error('No default converter found');
        }
        let text = '';
        if (step) {
            text = await converter.stringifyStep(step);
        }
        else if (this.#userFlow) {
            [text] = await converter.stringify(this.#userFlow);
        }
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(text);
        const metric = step ? converterIdToStepMetric(converter.getId()) : converterIdToFlowMetric(converter.getId());
        Host.userMetrics.recordingCopiedToClipboard(metric);
    }
    #onCopyStepEvent(event) {
        event.stopPropagation();
        void this.#copyCurrentSelection(event.step);
    }
    async #onCopy(event) {
        if (event.target !== document.body) {
            return;
        }
        event.preventDefault();
        await this.#copyCurrentSelection(this.#selectedStep);
        Host.userMetrics.keyboardShortcutFired("chrome-recorder.copy-recording-or-step" /* Actions.RecorderActions.COPY_RECORDING_OR_STEP */);
    }
    #renderSettings() {
        if (!this.#settings) {
            return html ``;
        }
        const environmentFragments = [];
        if (this.#settings.viewportSettings) {
            // clang-format off
            environmentFragments.push(html `<div>${this.#settings.viewportSettings.isMobile
                ? i18nString(UIStrings.mobile)
                : i18nString(UIStrings.desktop)}</div>`);
            environmentFragments.push(html `<div class="separator"></div>`);
            environmentFragments.push(html `<div>${this.#settings.viewportSettings.width}×${this.#settings.viewportSettings.height} px</div>`);
            // clang-format on
        }
        const replaySettingsFragments = [];
        if (!this.#replaySettingsExpanded) {
            if (this.#settings.networkConditionsSettings) {
                if (this.#settings.networkConditionsSettings.title) {
                    // clang-format off
                    replaySettingsFragments.push(html `<div>${this.#settings.networkConditionsSettings.title}</div>`);
                    // clang-format on
                }
                else {
                    // clang-format off
                    replaySettingsFragments.push(html `<div>
            ${i18nString(UIStrings.download, {
                        value: i18n.ByteUtilities.bytesToString(this.#settings.networkConditionsSettings.download),
                    })},
            ${i18nString(UIStrings.upload, {
                        value: i18n.ByteUtilities.bytesToString(this.#settings.networkConditionsSettings.upload),
                    })},
            ${i18nString(UIStrings.latency, {
                        value: this.#settings.networkConditionsSettings.latency,
                    })}
          </div>`);
                    // clang-format on
                }
            }
            else {
                // clang-format off
                replaySettingsFragments.push(html `<div>${SDK.NetworkManager.NoThrottlingConditions.title instanceof Function
                    ? SDK.NetworkManager.NoThrottlingConditions.title()
                    : SDK.NetworkManager.NoThrottlingConditions.title}</div>`);
                // clang-format on
            }
            // clang-format off
            replaySettingsFragments.push(html `<div class="separator"></div>`);
            replaySettingsFragments.push(html `<div>${i18nString(UIStrings.timeout, {
                value: this.#settings.timeout || Models.RecordingPlayer.defaultTimeout,
            })}</div>`);
            // clang-format on
        }
        else {
            // clang-format off
            const selectedOption = this.#settings.networkConditionsSettings?.i18nTitleKey ||
                SDK.NetworkManager.NoThrottlingConditions.i18nTitleKey;
            const selectedOptionTitle = networkConditionPresets.find(preset => preset.i18nTitleKey === selectedOption);
            let menuButtonTitle = '';
            if (selectedOptionTitle) {
                menuButtonTitle =
                    selectedOptionTitle.title instanceof Function
                        ? selectedOptionTitle.title()
                        : selectedOptionTitle.title;
            }
            replaySettingsFragments.push(html `<div class="editable-setting">
        <label class="wrapping-label" @click=${this.#onSelectMenuLabelClick}>
          ${i18nString(UIStrings.network)}
          <devtools-select-menu
            @selectmenuselected=${this.#onNetworkConditionsChange}
            .disabled=${!this.#steps.find(step => step.type === 'navigate')}
            .showDivider=${true}
            .showArrow=${true}
            .sideButton=${false}
            .showSelectedItem=${true}
            .jslogContext=${'network-conditions'}
            .position=${"bottom" /* Dialogs.Dialog.DialogVerticalPosition.BOTTOM */}
            .buttonTitle=${menuButtonTitle}
          >
            ${networkConditionPresets.map(condition => {
                return html `<devtools-menu-item
                .value=${condition.i18nTitleKey || ''}
                .selected=${selectedOption === condition.i18nTitleKey}
                jslog=${VisualLogging.item(Platform.StringUtilities.toKebabCase(condition.i18nTitleKey || ''))}
              >
                ${condition.title instanceof Function
                    ? condition.title()
                    : condition.title}
              </devtools-menu-item>`;
            })}
          </devtools-select-menu>
        </label>
      </div>`);
            replaySettingsFragments.push(html `<div class="editable-setting">
        <label class="wrapping-label" title=${i18nString(UIStrings.timeoutExplanation)}>
          ${i18nString(UIStrings.timeoutLabel)}
          <input
            @input=${this.#onTimeoutInput}
            required
            min=${Models.SchemaUtils.minTimeout}
            max=${Models.SchemaUtils.maxTimeout}
            value=${this.#settings.timeout || Models.RecordingPlayer.defaultTimeout}
            jslog=${VisualLogging.textField('timeout').track({ change: true })}
            class="devtools-text-input"
            type="number">
        </label>
      </div>`);
            // clang-format on
        }
        const isEditable = !this.#isRecording && !this.#replayState.isPlaying;
        const replaySettingsButtonClassMap = {
            'settings-title': true,
            expanded: this.#replaySettingsExpanded,
        };
        const replaySettingsClassMap = {
            expanded: this.#replaySettingsExpanded,
            settings: true,
        };
        // clang-format off
        return html `
      <div class="settings-row">
        <div class="settings-container">
          <div
            class=${Lit.Directives.classMap(replaySettingsButtonClassMap)}
            @keydown=${isEditable && this.#onReplaySettingsKeydown}
            @click=${isEditable && this.#onToggleReplaySettings}
            tabindex="0"
            role="button"
            jslog=${VisualLogging.action('replay-settings').track({ click: true })}
            aria-label=${i18nString(UIStrings.editReplaySettings)}>
            <span>${i18nString(UIStrings.replaySettings)}</span>
            ${isEditable
            ? html `<devtools-icon
                    class="chevron"
                    name="triangle-down">
                  </devtools-icon>`
            : ''}
          </div>
          <div class=${Lit.Directives.classMap(replaySettingsClassMap)}>
            ${replaySettingsFragments.length
            ? replaySettingsFragments
            : html `<div>${i18nString(UIStrings.default)}</div>`}
          </div>
        </div>
        <div class="settings-container">
          <div class="settings-title">${i18nString(UIStrings.environment)}</div>
          <div class="settings">
            ${environmentFragments.length
            ? environmentFragments
            : html `<div>${i18nString(UIStrings.default)}</div>`}
          </div>
        </div>
      </div>
    `;
        // clang-format on
    }
    #getCurrentConverter() {
        const currentConverter = [
            ...(this.#builtInConverters || []),
            ...(this.#extensionConverters || []),
        ].find(converter => converter.getId() === this.#converterId);
        if (!currentConverter) {
            return this.#builtInConverters[0];
        }
        return currentConverter;
    }
    #renderTimelineArea() {
        if (this.#extensionDescriptor) {
            // clang-format off
            return html `
        <devtools-recorder-extension-view .descriptor=${this.#extensionDescriptor}>
        </devtools-recorder-extension-view>
      `;
            // clang-format on
        }
        const currentConverter = this.#getCurrentConverter();
        const converterFormatName = currentConverter?.getFormatName();
        // clang-format off
        return !this.#showCodeView
            ? this.#renderSections()
            : html `
        <devtools-split-view direction="column" sidebar-position="second">
          <div slot="main">
            ${this.#renderSections()}
          </div>
          <div slot="sidebar" jslog=${VisualLogging.pane('source-code').track({ resize: true })}>
            <div class="section-toolbar" jslog=${VisualLogging.toolbar()}>
              <devtools-select-menu
                @selectmenuselected=${this.#onCodeFormatChange}
                .showDivider=${true}
                .showArrow=${true}
                .sideButton=${false}
                .showSelectedItem=${true}
                .position=${"bottom" /* Dialogs.Dialog.DialogVerticalPosition.BOTTOM */}
                .buttonTitle=${converterFormatName || ''}
                .jslogContext=${'code-format'}
              >
                ${this.#builtInConverters.map(converter => {
                return html `<devtools-menu-item
                    .value=${converter.getId()}
                    .selected=${this.#converterId === converter.getId()}
                    jslog=${VisualLogging.action().track({ click: true }).context(`converter-${Platform.StringUtilities.toKebabCase(converter.getId())}`)}
                  >
                    ${converter.getFormatName()}
                  </devtools-menu-item>`;
            })}
                ${this.#extensionConverters.map(converter => {
                return html `<devtools-menu-item
                    .value=${converter.getId()}
                    .selected=${this.#converterId === converter.getId()}
                    jslog=${VisualLogging.action().track({ click: true }).context('converter-extension')}
                  >
                    ${converter.getFormatName()}
                  </devtools-menu-item>`;
            })}
              </devtools-select-menu>
              <devtools-button
                title=${Models.Tooltip.getTooltipForActions(i18nString(UIStrings.hideCode), "chrome-recorder.toggle-code-view" /* Actions.RecorderActions.TOGGLE_CODE_VIEW */)}
                .data=${{
                variant: "icon" /* Buttons.Button.Variant.ICON */,
                size: "SMALL" /* Buttons.Button.Size.SMALL */,
                iconName: 'cross',
            }}
                @click=${this.showCodeToggle}
                jslog=${VisualLogging.close().track({ click: true })}
              ></devtools-button>
            </div>
            ${this.#renderTextEditor()}
          </div>
        </devtools-split-view>
      `;
        // clang-format on
    }
    #renderTextEditor() {
        if (!this.#editorState) {
            throw new Error('Unexpected: trying to render the text editor without editorState');
        }
        // clang-format off
        return html `
      <div class="text-editor" jslog=${VisualLogging.textField().track({ change: true })}>
        <devtools-text-editor .state=${this.#editorState}></devtools-text-editor>
      </div>
    `;
        // clang-format on
    }
    #renderScreenshot(section) {
        if (!section.screenshot) {
            return null;
        }
        // clang-format off
        return html `
      <img class="screenshot" src=${section.screenshot} alt=${i18nString(UIStrings.screenshotForSection)} />
    `;
        // clang-format on
    }
    #renderReplayOrAbortButton() {
        if (this.#replayState.isPlaying) {
            return html `
        <devtools-button .jslogContext=${'abort-replay'} @click=${this.#handleAbortReplay} .iconName=${'pause'} .variant=${"outlined" /* Buttons.Button.Variant.OUTLINED */}>
          ${i18nString(UIStrings.cancelReplay)}
        </devtools-button>`;
        }
        // clang-format off
        return html `<devtools-replay-section
        .data=${{
            settings: this.#recorderSettings,
            replayExtensions: this.#replayExtensions,
        }}
        .disabled=${this.#replayState.isPlaying}
        @startreplay=${this.#handleTogglePlaying}
        >
      </devtools-replay-section>`;
        // clang-format on
    }
    #handleMeasurePerformanceClickEvent(event) {
        event.stopPropagation();
        this.dispatchEvent(new PlayRecordingEvent({
            targetPanel: "timeline" /* TargetPanel.PERFORMANCE_PANEL */,
            speed: "normal" /* PlayRecordingSpeed.NORMAL */,
        }));
    }
    showCodeToggle = () => {
        this.#showCodeView = !this.#showCodeView;
        Host.userMetrics.recordingCodeToggled(this.#showCodeView ? 1 /* Host.UserMetrics.RecordingCodeToggled.CODE_SHOWN */ :
            2 /* Host.UserMetrics.RecordingCodeToggled.CODE_HIDDEN */);
        void this.#convertToCode();
    };
    #convertToCode = async () => {
        if (!this.#userFlow) {
            return;
        }
        const converter = this.#getCurrentConverter();
        if (!converter) {
            return;
        }
        const [code, sourceMap] = await converter.stringify(this.#userFlow);
        this.#code = code;
        this.#sourceMap = sourceMap;
        this.#sourceMap?.shift();
        const mediaType = converter.getMediaType();
        const languageSupport = mediaType ? await CodeHighlighter.CodeHighlighter.languageFromMIME(mediaType) : null;
        this.#editorState = CodeMirror.EditorState.create({
            doc: this.#code,
            extensions: [
                TextEditor.Config.baseConfiguration(this.#code),
                CodeMirror.EditorState.readOnly.of(true),
                CodeMirror.EditorView.lineWrapping,
                languageSupport ? languageSupport : [],
            ],
        });
        this.#render();
        // Used by tests.
        this.dispatchEvent(new Event('code-generated'));
    };
    #highlightCodeForStep = (step, scroll = false) => {
        if (!this.#sourceMap) {
            return;
        }
        const stepIndex = this.#steps.indexOf(step);
        if (stepIndex === -1) {
            return;
        }
        const editor = this.#shadow.querySelector('devtools-text-editor');
        if (!editor) {
            return;
        }
        const cm = editor.editor;
        if (!cm) {
            return;
        }
        const line = this.#sourceMap[stepIndex * 2];
        const length = this.#sourceMap[stepIndex * 2 + 1];
        let selection = editor.createSelection({ lineNumber: line + length, columnNumber: 0 }, { lineNumber: line, columnNumber: 0 });
        const lastLine = editor.state.doc.lineAt(selection.main.anchor);
        selection = editor.createSelection({ lineNumber: line + length - 1, columnNumber: lastLine.length + 1 }, { lineNumber: line, columnNumber: 0 });
        cm.dispatch({
            selection,
            effects: scroll ?
                [
                    CodeMirror.EditorView.scrollIntoView(selection.main, {
                        y: 'nearest',
                    }),
                ] :
                undefined,
        });
    };
    #onCodeFormatChange = (event) => {
        this.#converterId = event.itemValue;
        if (this.#recorderSettings) {
            this.#recorderSettings.preferredCopyFormat = event.itemValue;
        }
        void this.#convertToCode();
    };
    #renderSections() {
        // clang-format off
        return html `
      <div class="sections">
      ${!this.#showCodeView
            ? html `<div class="section-toolbar">
        <devtools-button
          @click=${this.showCodeToggle}
          class="show-code"
          .data=${{
                variant: "outlined" /* Buttons.Button.Variant.OUTLINED */,
                title: Models.Tooltip.getTooltipForActions(i18nString(UIStrings.showCode), "chrome-recorder.toggle-code-view" /* Actions.RecorderActions.TOGGLE_CODE_VIEW */),
            }}
          jslog=${VisualLogging.toggleSubpane("chrome-recorder.toggle-code-view" /* Actions.RecorderActions.TOGGLE_CODE_VIEW */).track({ click: true })}
        >
          ${i18nString(UIStrings.showCode)}
        </devtools-button>
      </div>`
            : ''}
      ${this.#sections.map((section, i) => html `
            <div class="section">
              <div class="screenshot-wrapper">
                ${this.#renderScreenshot(section)}
              </div>
              <div class="content">
                <div class="steps">
                  <devtools-step-view
                    @click=${this.#onStepClick}
                    @mouseover=${this.#onStepHover}
                    .data=${{
            section,
            state: this.#getSectionState(section),
            isStartOfGroup: true,
            isEndOfGroup: section.steps.length === 0,
            isFirstSection: i === 0,
            isLastSection: i === this.#sections.length - 1 &&
                section.steps.length === 0,
            isSelected: this.#selectedStep === (section.causingStep || null),
            sectionIndex: i,
            isRecording: this.#isRecording,
            isPlaying: this.#replayState.isPlaying,
            error: this.#getSectionState(section) === "error" /* State.ERROR */
                ? this.#currentError
                : undefined,
            hasBreakpoint: false,
            removable: this.#steps.length > 1 && section.causingStep,
        }}
                  >
                  </devtools-step-view>
                  ${section.steps.map(step => this.#renderStep(section, step, i === this.#sections.length - 1))}
                  ${!this.#recordingTogglingInProgress && this.#isRecording && i === this.#sections.length - 1 ? html `<devtools-button
                    class="step add-assertion-button"
                    .data=${{
            variant: "outlined" /* Buttons.Button.Variant.OUTLINED */,
            title: i18nString(UIStrings.addAssertion),
            jslogContext: 'add-assertion',
        }}
                    @click=${this.#dispatchAddAssertionEvent}
                  >${i18nString(UIStrings.addAssertion)}</devtools-button>` : undefined}
                  ${this.#isRecording && i === this.#sections.length - 1
            ? html `<div class="step recording">${i18nString(UIStrings.recording)}</div>`
            : null}
                </div>
              </div>
            </div>
      `)}
      </div>
    `;
        // clang-format on
    }
    #renderHeader() {
        if (!this.#userFlow) {
            return '';
        }
        const { title } = this.#userFlow;
        const isTitleEditable = !this.#replayState.isPlaying && !this.#isRecording;
        // clang-format off
        return html `
      <div class="header">
        <div class="header-title-wrapper">
          <div class="header-title">
            <span @blur=${this.#onTitleBlur}
                  @keydown=${this.#onTitleInputKeyDown}
                  id="title-input"
                  .contentEditable=${isTitleEditable ? 'true' : 'false'}
                  jslog=${VisualLogging.value('title').track({ change: true })}
                  class=${Lit.Directives.classMap({
            'has-error': this.#isTitleInvalid,
            disabled: !isTitleEditable,
        })}
                  .innerText=${Lit.Directives.live(title)}></span>
            <div class="title-button-bar">
              <devtools-button
                @click=${this.#onEditTitleButtonClick}
                .data=${{
            disabled: !isTitleEditable,
            variant: "toolbar" /* Buttons.Button.Variant.TOOLBAR */,
            iconName: 'edit',
            title: i18nString(UIStrings.editTitle),
            jslogContext: 'edit-title',
        }}
              ></devtools-button>
            </div>
          </div>
          ${this.#isTitleInvalid
            ? html `<div class="title-input-error-text">
            ${i18nString(UIStrings.requiredTitleError)}
          </div>`
            : ''}
        </div>
        ${!this.#isRecording && this.#replayAllowed
            ? html `<div class="actions">
                <devtools-button
                  @click=${this.#handleMeasurePerformanceClickEvent}
                  .data=${{
                disabled: this.#replayState.isPlaying,
                variant: "outlined" /* Buttons.Button.Variant.OUTLINED */,
                iconName: 'performance',
                title: i18nString(UIStrings.performancePanel),
                jslogContext: 'measure-performance',
            }}
                >
                  ${i18nString(UIStrings.performancePanel)}
                </devtools-button>
                <div class="separator"></div>
                ${this.#renderReplayOrAbortButton()}
              </div>`
            : ''}
      </div>`;
        // clang-format on
    }
    #renderFooter() {
        if (!this.#isRecording) {
            return '';
        }
        const translation = this.#recordingTogglingInProgress ? i18nString(UIStrings.recordingIsBeingStopped) :
            i18nString(UIStrings.endRecording);
        // clang-format off
        return html `
      <div class="footer">
        <div class="controls">
          <devtools-control-button
            jslog=${VisualLogging.toggle('toggle-recording').track({ click: true })}
            @click=${this.#dispatchRecordingFinished}
            .disabled=${this.#recordingTogglingInProgress}
            .shape=${'square'}
            .label=${translation}
            title=${Models.Tooltip.getTooltipForActions(translation, "chrome-recorder.start-recording" /* Actions.RecorderActions.START_RECORDING */)}
          >
          </devtools-control-button>
        </div>
      </div>
    `;
        // clang-format on
    }
    #render() {
        const classNames = {
            wrapper: true,
            'is-recording': this.#isRecording,
            'is-playing': this.#replayState.isPlaying,
            'was-successful': this.#lastReplayResult === "Success" /* Models.RecordingPlayer.ReplayResult.SUCCESS */,
            'was-failure': this.#lastReplayResult === "Failure" /* Models.RecordingPlayer.ReplayResult.FAILURE */,
        };
        // clang-format off
        Lit.render(html `
      <div @click=${this.#onWrapperClick} class=${Lit.Directives.classMap(classNames)}>
        <div class="main">
          ${this.#renderHeader()}
          ${this.#extensionDescriptor
            ? html `
            <devtools-recorder-extension-view .descriptor=${this.#extensionDescriptor}>
            </devtools-recorder-extension-view>
          `
            : html `
            ${this.#renderSettings()}
            ${this.#renderTimelineArea()}
          `}
          ${this.#renderFooter()}
        </div>
      </div>
    `, this.#shadow, { host: this });
        // clang-format on
    }
}
customElements.define('devtools-recording-view', RecordingView);
//# sourceMappingURL=RecordingView.js.map