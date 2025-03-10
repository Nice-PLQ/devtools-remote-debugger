// Copyright (c) 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import './LinearMemoryValueInterpreter.js';
import './LinearMemoryHighlightChipList.js';
import './LinearMemoryViewer.js';
import * as Common from '../../../core/common/common.js';
import * as i18n from '../../../core/i18n/i18n.js';
import { html, nothing, render } from '../../../ui/lit/lit.js';
import linearMemoryInspectorStylesRaw from './linearMemoryInspector.css.js';
import { formatAddress, parseAddress } from './LinearMemoryInspectorUtils.js';
import { getDefaultValueTypeMapping, VALUE_INTEPRETER_MAX_NUM_BYTES, } from './ValueInterpreterDisplayUtils.js';
// TODO(crbug.com/391381439): Fully migrate off of constructed style sheets.
const linearMemoryInspectorStyles = new CSSStyleSheet();
linearMemoryInspectorStyles.replaceSync(linearMemoryInspectorStylesRaw.cssContent);
const UIStrings = {
    /**
     *@description Tooltip text that appears when hovering over an invalid address in the address line in the Linear memory inspector
     *@example {0x00000000} PH1
     *@example {0x00400000} PH2
     */
    addressHasToBeANumberBetweenSAnd: 'Address has to be a number between {PH1} and {PH2}',
};
const str_ = i18n.i18n.registerUIStrings('panels/linear_memory_inspector/components/LinearMemoryInspector.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class MemoryRequestEvent extends Event {
    static eventName = 'memoryrequest';
    data;
    constructor(start, end, address) {
        super(MemoryRequestEvent.eventName);
        this.data = { start, end, address };
    }
}
export class AddressChangedEvent extends Event {
    static eventName = 'addresschanged';
    data;
    constructor(address) {
        super(AddressChangedEvent.eventName);
        this.data = address;
    }
}
export class SettingsChangedEvent extends Event {
    static eventName = 'settingschanged';
    data;
    constructor(settings) {
        super(SettingsChangedEvent.eventName);
        this.data = settings;
    }
}
class AddressHistoryEntry {
    #address = 0;
    #callback;
    constructor(address, callback) {
        if (address < 0) {
            throw new Error('Address should be a greater or equal to zero');
        }
        this.#address = address;
        this.#callback = callback;
    }
    valid() {
        return true;
    }
    reveal() {
        this.#callback(this.#address);
    }
}
export class LinearMemoryInspector extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #history = new Common.SimpleHistoryManager.SimpleHistoryManager(10);
    #memory = new Uint8Array();
    #memoryOffset = 0;
    #outerMemoryLength = 0;
    #address = -1;
    #highlightInfo;
    #currentNavigatorMode = "Submitted" /* Mode.SUBMITTED */;
    #currentNavigatorAddressLine = `${this.#address}`;
    #numBytesPerPage = 4;
    #valueTypeModes = getDefaultValueTypeMapping();
    #valueTypes = new Set(this.#valueTypeModes.keys());
    #endianness = "Little Endian" /* Endianness.LITTLE */;
    #hideValueInspector = false;
    connectedCallback() {
        this.#shadow.adoptedStyleSheets = [linearMemoryInspectorStyles];
    }
    set data(data) {
        if (data.address < data.memoryOffset || data.address > data.memoryOffset + data.memory.length || data.address < 0) {
            throw new Error('Address is out of bounds.');
        }
        if (data.memoryOffset < 0) {
            throw new Error('Memory offset has to be greater or equal to zero.');
        }
        if (data.highlightInfo) {
            if (data.highlightInfo.size < 0) {
                throw new Error('Object size has to be greater than or equal to zero');
            }
            if (data.highlightInfo.startAddress < 0 || data.highlightInfo.startAddress >= data.outerMemoryLength) {
                throw new Error('Object start address is out of bounds.');
            }
        }
        this.#memory = data.memory;
        this.#memoryOffset = data.memoryOffset;
        this.#outerMemoryLength = data.outerMemoryLength;
        this.#valueTypeModes = data.valueTypeModes || this.#valueTypeModes;
        this.#valueTypes = data.valueTypes || this.#valueTypes;
        this.#endianness = data.endianness || this.#endianness;
        this.#highlightInfo = data.highlightInfo;
        this.#hideValueInspector = data.hideValueInspector ?? this.#hideValueInspector;
        this.#setAddress(data.address);
        this.#render();
    }
    #render() {
        const { start, end } = this.#getPageRangeForAddress(this.#address, this.#numBytesPerPage);
        const navigatorAddressToShow = this.#currentNavigatorMode === "Submitted" /* Mode.SUBMITTED */ ? formatAddress(this.#address) :
            this.#currentNavigatorAddressLine;
        const navigatorAddressIsValid = this.#isValidAddress(navigatorAddressToShow);
        const invalidAddressMsg = i18nString(UIStrings.addressHasToBeANumberBetweenSAnd, { PH1: formatAddress(0), PH2: formatAddress(this.#outerMemoryLength) });
        const errorMsg = navigatorAddressIsValid ? undefined : invalidAddressMsg;
        const canGoBackInHistory = this.#history.canRollback();
        const canGoForwardInHistory = this.#history.canRollover();
        const highlightedMemoryAreas = this.#highlightInfo ? [this.#highlightInfo] : [];
        const focusedMemoryHighlight = this.#getSmallestEnclosingMemoryHighlight(highlightedMemoryAreas, this.#address);
        // Disabled until https://crbug.com/1079231 is fixed.
        // clang-format off
        render(html `
      <div class="view">
        <devtools-linear-memory-inspector-navigator
          .data=${{ address: navigatorAddressToShow, valid: navigatorAddressIsValid, mode: this.#currentNavigatorMode, error: errorMsg, canGoBackInHistory, canGoForwardInHistory }}
          @refreshrequested=${this.#onRefreshRequest}
          @addressinputchanged=${this.#onAddressChange}
          @pagenavigation=${this.#navigatePage}
          @historynavigation=${this.#navigateHistory}></devtools-linear-memory-inspector-navigator>
          <devtools-linear-memory-highlight-chip-list
          .data=${{ highlightInfos: highlightedMemoryAreas, focusedMemoryHighlight }}
          @jumptohighlightedmemory=${this.#onJumpToAddress}>
          </devtools-linear-memory-highlight-chip-list>
        <devtools-linear-memory-inspector-viewer
          .data=${{
            memory: this.#memory.slice(start - this.#memoryOffset, end - this.#memoryOffset),
            address: this.#address, memoryOffset: start,
            focus: this.#currentNavigatorMode === "Submitted" /* Mode.SUBMITTED */,
            highlightInfo: this.#highlightInfo,
            focusedMemoryHighlight
        }}
          @byteselected=${this.#onByteSelected}
          @resize=${this.#resize}>
        </devtools-linear-memory-inspector-viewer>
      </div>
      ${this.#hideValueInspector ? nothing : html `
      <div class="value-interpreter">
        <devtools-linear-memory-inspector-interpreter
          .data=${{
            value: this.#memory.slice(this.#address - this.#memoryOffset, this.#address + VALUE_INTEPRETER_MAX_NUM_BYTES).buffer,
            valueTypes: this.#valueTypes,
            valueTypeModes: this.#valueTypeModes,
            endianness: this.#endianness,
            memoryLength: this.#outerMemoryLength
        }}
          @valuetypetoggled=${this.#onValueTypeToggled}
          @valuetypemodechanged=${this.#onValueTypeModeChanged}
          @endiannesschanged=${this.#onEndiannessChanged}
          @jumptopointeraddress=${this.#onJumpToAddress}
          >
        </devtools-linear-memory-inspector-interpreter/>
      </div>`}
      `, this.#shadow, {
            host: this,
        });
        // clang-format on
    }
    #onJumpToAddress(e) {
        // Stop event from bubbling up, since no element further up needs the event.
        e.stopPropagation();
        this.#currentNavigatorMode = "Submitted" /* Mode.SUBMITTED */;
        const addressInRange = Math.max(0, Math.min(e.data, this.#outerMemoryLength - 1));
        this.#jumpToAddress(addressInRange);
    }
    #onRefreshRequest() {
        const { start, end } = this.#getPageRangeForAddress(this.#address, this.#numBytesPerPage);
        this.dispatchEvent(new MemoryRequestEvent(start, end, this.#address));
    }
    #onByteSelected(e) {
        this.#currentNavigatorMode = "Submitted" /* Mode.SUBMITTED */;
        const addressInRange = Math.max(0, Math.min(e.data, this.#outerMemoryLength - 1));
        this.#jumpToAddress(addressInRange);
    }
    #createSettings() {
        return { valueTypes: this.#valueTypes, modes: this.#valueTypeModes, endianness: this.#endianness };
    }
    #onEndiannessChanged(e) {
        this.#endianness = e.data;
        this.dispatchEvent(new SettingsChangedEvent(this.#createSettings()));
        this.#render();
    }
    #isValidAddress(address) {
        const newAddress = parseAddress(address);
        return newAddress !== undefined && newAddress >= 0 && newAddress < this.#outerMemoryLength;
    }
    #onAddressChange(e) {
        const { address, mode } = e.data;
        const isValid = this.#isValidAddress(address);
        const newAddress = parseAddress(address);
        this.#currentNavigatorAddressLine = address;
        if (newAddress !== undefined && isValid) {
            this.#currentNavigatorMode = mode;
            this.#jumpToAddress(newAddress);
            return;
        }
        if (mode === "Submitted" /* Mode.SUBMITTED */ && !isValid) {
            this.#currentNavigatorMode = "InvalidSubmit" /* Mode.INVALID_SUBMIT */;
        }
        else {
            this.#currentNavigatorMode = "Edit" /* Mode.EDIT */;
        }
        this.#render();
    }
    #onValueTypeToggled(e) {
        const { type, checked } = e.data;
        if (checked) {
            this.#valueTypes.add(type);
        }
        else {
            this.#valueTypes.delete(type);
        }
        this.dispatchEvent(new SettingsChangedEvent(this.#createSettings()));
        this.#render();
    }
    #onValueTypeModeChanged(e) {
        e.stopImmediatePropagation();
        const { type, mode } = e.data;
        this.#valueTypeModes.set(type, mode);
        this.dispatchEvent(new SettingsChangedEvent(this.#createSettings()));
        this.#render();
    }
    #navigateHistory(e) {
        return e.data === "Forward" /* Navigation.FORWARD */ ? this.#history.rollover() : this.#history.rollback();
    }
    #navigatePage(e) {
        const newAddress = e.data === "Forward" /* Navigation.FORWARD */ ? this.#address + this.#numBytesPerPage : this.#address - this.#numBytesPerPage;
        const addressInRange = Math.max(0, Math.min(newAddress, this.#outerMemoryLength - 1));
        this.#jumpToAddress(addressInRange);
    }
    #jumpToAddress(address) {
        if (address < 0 || address >= this.#outerMemoryLength) {
            console.warn(`Specified address is out of bounds: ${address}`);
            return;
        }
        this.#setAddress(address);
        this.#update();
    }
    #getPageRangeForAddress(address, numBytesPerPage) {
        const pageNumber = Math.floor(address / numBytesPerPage);
        const pageStartAddress = pageNumber * numBytesPerPage;
        const pageEndAddress = Math.min(pageStartAddress + numBytesPerPage, this.#outerMemoryLength);
        return { start: pageStartAddress, end: pageEndAddress };
    }
    #resize(event) {
        this.#numBytesPerPage = event.data;
        this.#update();
    }
    #update() {
        const { start, end } = this.#getPageRangeForAddress(this.#address, this.#numBytesPerPage);
        if (start < this.#memoryOffset || end > this.#memoryOffset + this.#memory.length) {
            this.dispatchEvent(new MemoryRequestEvent(start, end, this.#address));
        }
        else {
            this.#render();
        }
    }
    #setAddress(address) {
        // If we are already showing the address that is requested, no need to act upon it.
        if (this.#address === address) {
            return;
        }
        const historyEntry = new AddressHistoryEntry(address, () => this.#jumpToAddress(address));
        this.#history.push(historyEntry);
        this.#address = address;
        this.dispatchEvent(new AddressChangedEvent(this.#address));
    }
    // Returns the highlightInfo with the smallest size property that encloses the provided address.
    // If there are multiple smallest enclosing highlights, we pick the one appearing the earliest in highlightedMemoryAreas.
    // If no such highlightInfo exists, it returns undefined.
    //
    // Selecting the smallest enclosing memory highlight is a heuristic that aims to pick the
    // most specific highlight given a provided address. This way, objects contained in other objects are
    // potentially still accessible.
    #getSmallestEnclosingMemoryHighlight(highlightedMemoryAreas, address) {
        let smallestEnclosingHighlight;
        for (const highlightedMemory of highlightedMemoryAreas) {
            if (highlightedMemory.startAddress <= address &&
                address < highlightedMemory.startAddress + highlightedMemory.size) {
                if (!smallestEnclosingHighlight) {
                    smallestEnclosingHighlight = highlightedMemory;
                }
                else if (highlightedMemory.size < smallestEnclosingHighlight.size) {
                    smallestEnclosingHighlight = highlightedMemory;
                }
            }
        }
        return smallestEnclosingHighlight;
    }
}
customElements.define('devtools-linear-memory-inspector-inspector', LinearMemoryInspector);
//# sourceMappingURL=LinearMemoryInspector.js.map