(function () {
    'use strict';

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    const noop = () => void 0;
    class Logger {
        #log;
        #time;
        #timeEnd;
        constructor(level) {
            switch (level) {
                case 'silent':
                    this.#log = noop;
                    this.#time = noop;
                    this.#timeEnd = noop;
                    break;
                default:
                    // eslint-disable-next-line no-console
                    this.#log = console.log;
                    this.#time = console.time;
                    this.#timeEnd = console.timeEnd;
                    break;
            }
        }
        log(...args) {
            this.#log(...args);
        }
        timed(label, action) {
            this.#time(label);
            const value = action();
            this.#timeEnd(label);
            return value;
        }
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class MonotonicArray {
        #values = new WeakMap();
        #nextId = 1;
        getOrInsert = (node) => {
            const value = this.#values.get(node);
            if (value !== undefined) {
                return value;
            }
            this.#values.set(node, this.#nextId);
            this.#nextId++;
            return this.#nextId - 1;
        };
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class ARIASelectorComputer {
        #bindings;
        constructor(bindings) {
            this.#bindings = bindings;
        }
        // Takes a path consisting of element names and roles and makes sure that
        // every element resolves to a single result. If it does, the selector is added
        // to the chain of selectors.
        #computeUniqueARIASelectorForElements = (elements, queryByRoleOnly) => {
            const selectors = [];
            let parent = document;
            for (const element of elements) {
                let result = this.#queryA11yTreeOneByName(parent, element.name);
                if (result) {
                    selectors.push(element.name);
                    parent = result;
                    continue;
                }
                if (queryByRoleOnly) {
                    result = this.#queryA11yTreeOneByRole(parent, element.role);
                    if (result) {
                        selectors.push(`[role="${element.role}"]`);
                        parent = result;
                        continue;
                    }
                }
                result = this.#queryA11yTreeOneByNameAndRole(parent, element.name, element.role);
                if (result) {
                    selectors.push(`${element.name}[role="${element.role}"]`);
                    parent = result;
                    continue;
                }
                return;
            }
            return selectors;
        };
        #queryA11yTreeOneByName = (parent, name) => {
            if (!name) {
                return null;
            }
            const maxResults = 2;
            const result = this.#queryA11yTree(parent, name, undefined, maxResults);
            if (result.length !== 1) {
                return null;
            }
            return result[0];
        };
        #queryA11yTreeOneByRole = (parent, role) => {
            if (!role) {
                return null;
            }
            const maxResults = 2;
            const result = this.#queryA11yTree(parent, undefined, role, maxResults);
            if (result.length !== 1) {
                return null;
            }
            return result[0];
        };
        #queryA11yTreeOneByNameAndRole = (parent, name, role) => {
            if (!role || !name) {
                return null;
            }
            const maxResults = 2;
            const result = this.#queryA11yTree(parent, name, role, maxResults);
            if (result.length !== 1) {
                return null;
            }
            return result[0];
        };
        // Queries the DOM tree for elements with matching accessibility name and role.
        // It attempts to mimic https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/#method-queryAXTree.
        #queryA11yTree = (parent, name, role, maxResults = 0) => {
            const result = [];
            if (!name && !role) {
                throw new Error('Both role and name are empty');
            }
            const shouldMatchName = Boolean(name);
            const shouldMatchRole = Boolean(role);
            const collect = (root) => {
                const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
                do {
                    const currentNode = iter.currentNode;
                    if (currentNode.shadowRoot) {
                        collect(currentNode.shadowRoot);
                    }
                    if (currentNode instanceof ShadowRoot) {
                        continue;
                    }
                    if (shouldMatchName && this.#bindings.getAccessibleName(currentNode) !== name) {
                        continue;
                    }
                    if (shouldMatchRole && this.#bindings.getAccessibleRole(currentNode) !== role) {
                        continue;
                    }
                    result.push(currentNode);
                    if (maxResults && result.length >= maxResults) {
                        return;
                    }
                } while (iter.nextNode());
            };
            collect(parent instanceof Document ? document.documentElement : parent);
            return result;
        };
        compute = (node) => {
            let selector;
            let current = node;
            const elements = [];
            while (current) {
                const role = this.#bindings.getAccessibleRole(current);
                const name = this.#bindings.getAccessibleName(current);
                if (!role && !name) {
                    if (current === node) {
                        break;
                    }
                }
                else {
                    elements.unshift({ name, role });
                    selector = this.#computeUniqueARIASelectorForElements(elements, current !== node);
                    if (selector) {
                        break;
                    }
                    if (current !== node) {
                        elements.shift();
                    }
                }
                current = current.parentNode;
                if (current instanceof ShadowRoot) {
                    current = current.host;
                }
            }
            return selector;
        };
    }
    /**
     * Computes the ARIA selector for a node.
     *
     * @param node - The node to compute.
     * @returns The computed CSS selector.
     *
     * @internal
     */
    const computeARIASelector = (node, bindings) => {
        return new ARIASelectorComputer(bindings).compute(node);
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class SelectorPart {
        value;
        optimized;
        constructor(value, optimized) {
            this.value = value;
            this.optimized = optimized || false;
        }
        toString() {
            return this.value;
        }
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    const idSelector = (id) => {
        return `#${CSS.escape(id)}`;
    };
    const attributeSelector$1 = (name, value) => {
        return `[${name}='${CSS.escape(value)}']`;
    };
    const classSelector = (selector, className) => {
        return `${selector}.${CSS.escape(className)}`;
    };
    const nthTypeSelector = (selector, index) => {
        return `${selector}:nth-of-type(${index + 1})`;
    };
    const typeSelector = (selector, type) => {
        return `${selector}${attributeSelector$1('type', type)}`;
    };
    const hasUniqueId = (node) => {
        return (Boolean(node.id) && node.getRootNode().querySelectorAll(idSelector(node.id)).length === 1);
    };
    const isUniqueAmongTagNames = (node, children) => {
        for (const child of children) {
            if (child !== node && child.tagName === node.tagName) {
                return false;
            }
        }
        return true;
    };
    const isUniqueAmongInputTypes = (node, children) => {
        for (const child of children) {
            if (child !== node && child instanceof HTMLInputElement && child.type === node.type) {
                return false;
            }
        }
        return true;
    };
    const getUniqueClassName = (node, children) => {
        const classNames = new Set(node.classList);
        for (const child of children) {
            if (child !== node) {
                for (const className of child.classList) {
                    classNames.delete(className);
                }
                if (classNames.size === 0) {
                    break;
                }
            }
        }
        if (classNames.size > 0) {
            return classNames.values().next().value;
        }
        return undefined;
    };
    const getTypeIndex = (node, children) => {
        let nthTypeIndex = 0;
        for (const child of children) {
            if (child === node) {
                return nthTypeIndex;
            }
            if (child.tagName === node.tagName) {
                ++nthTypeIndex;
            }
        }
        throw new Error('Node not found in children');
    };
    const getSelectorPart$1 = (node, attributes = []) => {
        if (!(node instanceof Element)) {
            return;
        }
        // Declared attibutes have the greatest priority.
        for (const attribute of attributes) {
            const value = node.getAttribute(attribute);
            if (value) {
                return new SelectorPart(attributeSelector$1(attribute, value), true);
            }
        }
        // IDs are supposed to be globally unique, so this has second priority.
        if (hasUniqueId(node)) {
            return new SelectorPart(idSelector(node.id), true);
        }
        // All selectors will be prefixed with the tag name starting here.
        const selector = node.tagName.toLowerCase();
        // These can only appear once in the entire document, so handle this fast.
        switch (node.tagName) {
            case 'BODY':
            case 'HEAD':
            case 'HTML':
                return new SelectorPart(selector, true);
        }
        const parent = node.parentNode;
        // If the node has no parent, then the node must be detached. We handle this
        // gracefully.
        if (!parent) {
            return new SelectorPart(selector, true);
        }
        const children = parent.children;
        // Determine if the child has a unique node name among all children.
        if (isUniqueAmongTagNames(node, children)) {
            return new SelectorPart(selector, true);
        }
        // If it's an input, check uniqueness among types.
        if (node instanceof HTMLInputElement && isUniqueAmongInputTypes(node, children)) {
            return new SelectorPart(typeSelector(selector, node.type), true);
        }
        // Determine if the child has a unique class name.
        const className = getUniqueClassName(node, children);
        if (className !== undefined) {
            return new SelectorPart(classSelector(selector, className), true);
        }
        // Last resort. Just use the nth-type index. A priori, this will always exists.
        return new SelectorPart(nthTypeSelector(selector, getTypeIndex(node, children)), false);
    };
    /**
     * The goal of this function is to find the smallest index `i` that makes
     * `gte(valueOf(i), j)` true for all `j` in `[min, max)`. We do not use binary
     * search because
     *
     *  1. We expect the min-max to be concentrated towards the minimum (< 10
     *     iterations).
     *  2. We expect `valueOf` to be `O(n)`, so together with (1), the average will
     *     be around `O(n)` which is significantly faster than binary search in this
     *     case.
     */
    const findMinMax = ([min, max], fns) => {
        fns.self ??= (i) => i;
        let index = fns.inc(min);
        let value;
        let isMax;
        do {
            value = fns.valueOf(min);
            isMax = true;
            while (index !== max) {
                min = fns.self(index);
                index = fns.inc(min);
                if (!fns.gte(value, index)) {
                    isMax = false;
                    break;
                }
            }
        } while (!isMax);
        return value;
    };
    class SelectorRangeOps {
        // Close chains (using `>`) are stored in inner arrays.
        #buffer = [[]];
        #attributes;
        #depth = 0;
        constructor(attributes = []) {
            this.#attributes = attributes;
        }
        inc(node) {
            return node.parentNode ?? node.getRootNode();
        }
        valueOf(node) {
            const part = getSelectorPart$1(node, this.#attributes);
            if (!part) {
                throw new Error('Node is not an element');
            }
            if (this.#depth > 1) {
                // Implies this selector is for a distant ancestor.
                this.#buffer.unshift([part]);
            }
            else {
                // Implies this selector is for a parent.
                this.#buffer[0].unshift(part);
            }
            this.#depth = 0;
            return this.#buffer.map(parts => parts.join(' > ')).join(' ');
        }
        gte(selector, node) {
            ++this.#depth;
            return node.querySelectorAll(selector).length === 1;
        }
    }
    /**
     * Computes the CSS selector for a node.
     *
     * @param node - The node to compute.
     * @returns The computed CSS selector.
     *
     * @internal
     */
    const computeCSSSelector = (node, attributes) => {
        const selectors = [];
        // We want to find the minimal selector that is unique within a document. We
        // are slightly restricted since selectors cannot cross ShadowRoot borders, so
        // the actual goal is to find the minimal selector that is unique within a
        // root node. We then need to repeat this for each shadow root.
        try {
            let root;
            while (node instanceof Element) {
                root = node.getRootNode();
                selectors.unshift(findMinMax([node, root], new SelectorRangeOps(attributes)));
                node = root instanceof ShadowRoot ? root.host : root;
            }
        }
        catch {
            return undefined;
        }
        return selectors;
    };
    const queryCSSSelectorAll = (selectors) => {
        if (typeof selectors === 'string') {
            selectors = [selectors];
        }
        else if (selectors.length === 0) {
            return [];
        }
        let lists = [
            [document.documentElement],
        ];
        do {
            const selector = selectors.shift();
            const roots = [];
            for (const nodes of lists) {
                for (const node of nodes) {
                    const list = (node.shadowRoot ?? node).querySelectorAll(selector);
                    if (list.length > 0) {
                        roots.push(list);
                    }
                }
            }
            lists = roots;
        } while (selectors.length > 0 && lists.length > 0);
        return lists.flatMap(list => [...list]);
    };

    /**
     * @license
     * Copyright 2022 Google Inc.
     * SPDX-License-Identifier: Apache-2.0
     */
    /**
     * @internal
     */
    const pierceQuerySelector = (root, selector) => {
        let found = null;
        const search = (root) => {
            const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            do {
                const currentNode = iter.currentNode;
                if (currentNode.shadowRoot) {
                    search(currentNode.shadowRoot);
                }
                if (currentNode instanceof ShadowRoot) {
                    continue;
                }
                if (currentNode !== root && !found && currentNode.matches(selector)) {
                    found = currentNode;
                }
            } while (!found && iter.nextNode());
        };
        if (root instanceof Document) {
            root = root.documentElement;
        }
        search(root);
        return found;
    };
    /**
     * @internal
     */
    const pierceQuerySelectorAll = (element, selector) => {
        const result = [];
        const collect = (root) => {
            const iter = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
            do {
                const currentNode = iter.currentNode;
                if (currentNode.shadowRoot) {
                    collect(currentNode.shadowRoot);
                }
                if (currentNode instanceof ShadowRoot) {
                    continue;
                }
                if (currentNode !== root && currentNode.matches(selector)) {
                    result.push(currentNode);
                }
            } while (iter.nextNode());
        };
        if (element instanceof Document) {
            element = element.documentElement;
        }
        collect(element);
        return result;
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class PierceSelectorRangeOpts {
        #selector = [[]];
        #attributes;
        #depth = 0;
        constructor(attributes = []) {
            this.#attributes = attributes;
        }
        inc(node) {
            return node.getRootNode();
        }
        self(node) {
            return node instanceof ShadowRoot ? node.host : node;
        }
        valueOf(node) {
            const selector = findMinMax([node, node.getRootNode()], new SelectorRangeOps(this.#attributes));
            if (this.#depth > 1) {
                this.#selector.unshift([selector]);
            }
            else {
                this.#selector[0].unshift(selector);
            }
            this.#depth = 0;
            return this.#selector;
        }
        gte(selector, node) {
            ++this.#depth;
            // Note we use some insider logic here. `valueOf(node)` will always
            // correspond to `selector.flat().slice(1)`, so it suffices to check
            // uniqueness for `selector.flat()[0]`.
            return pierceQuerySelectorAll(node, selector[0][0]).length === 1;
        }
    }
    /**
     * Computes the pierce CSS selector for a node.
     *
     * @param node - The node to compute.
     * @returns The computed pierce CSS selector.
     *
     * @internal
     */
    const computePierceSelector = (node, attributes) => {
        try {
            const ops = new PierceSelectorRangeOpts(attributes);
            return findMinMax([node, document], ops).flat();
        }
        catch {
            return undefined;
        }
    };
    const queryPierceSelectorAll = (selectors) => {
        if (typeof selectors === 'string') {
            selectors = [selectors];
        }
        else if (selectors.length === 0) {
            return [];
        }
        let lists = [[document.documentElement]];
        do {
            const selector = selectors.shift();
            const roots = [];
            for (const nodes of lists) {
                for (const node of nodes) {
                    const list = pierceQuerySelectorAll(node.shadowRoot ?? node, selector);
                    if (list.length > 0) {
                        roots.push(list);
                    }
                }
            }
            lists = roots;
        } while (selectors.length > 0 && lists.length > 0);
        return lists.flatMap(list => [...list]);
    };

    /**
     * @license
     * Copyright 2022 Google Inc.
     * SPDX-License-Identifier: Apache-2.0
     */
    const TRIVIAL_VALUE_INPUT_TYPES = new Set(['checkbox', 'image', 'radio']);
    /**
     * Determines if the node has a non-trivial value property.
     *
     * @internal
     */
    const isNonTrivialValueNode = (node) => {
        if (node instanceof HTMLSelectElement) {
            return true;
        }
        if (node instanceof HTMLTextAreaElement) {
            return true;
        }
        if (node instanceof HTMLInputElement &&
            !TRIVIAL_VALUE_INPUT_TYPES.has(node.type)) {
            return true;
        }
        return false;
    };
    const UNSUITABLE_NODE_NAMES = new Set(['SCRIPT', 'STYLE']);
    /**
     * Determines whether a given node is suitable for text matching.
     *
     * @internal
     */
    const isSuitableNodeForTextMatching = (node) => {
        return (!UNSUITABLE_NODE_NAMES.has(node.nodeName) && !document.head?.contains(node));
    };
    /**
     * Maps {@link Node}s to their computed {@link TextContent}.
     */
    const textContentCache = new WeakMap();
    const eraseFromCache = (node) => {
        while (node) {
            textContentCache.delete(node);
            if (node instanceof ShadowRoot) {
                node = node.host;
            }
            else {
                node = node.parentNode;
            }
        }
    };
    /**
     * Erases the cache when the tree has mutated text.
     */
    const observedNodes = new WeakSet();
    const textChangeObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            eraseFromCache(mutation.target);
        }
    });
    /**
     * Builds the text content of a node using some custom logic.
     *
     * @remarks
     * The primary reason this function exists is due to {@link ShadowRoot}s not having
     * text content.
     *
     * @internal
     */
    const createTextContent = (root) => {
        let value = textContentCache.get(root);
        if (value) {
            return value;
        }
        value = { full: '', immediate: [] };
        if (!isSuitableNodeForTextMatching(root)) {
            return value;
        }
        let currentImmediate = '';
        if (isNonTrivialValueNode(root)) {
            value.full = root.value;
            value.immediate.push(root.value);
            root.addEventListener('input', event => {
                eraseFromCache(event.target);
            }, { once: true, capture: true });
        }
        else {
            for (let child = root.firstChild; child; child = child.nextSibling) {
                if (child.nodeType === Node.TEXT_NODE) {
                    value.full += child.nodeValue ?? '';
                    currentImmediate += child.nodeValue ?? '';
                    continue;
                }
                if (currentImmediate) {
                    value.immediate.push(currentImmediate);
                }
                currentImmediate = '';
                if (child.nodeType === Node.ELEMENT_NODE) {
                    value.full += createTextContent(child).full;
                }
            }
            if (currentImmediate) {
                value.immediate.push(currentImmediate);
            }
            if (root instanceof Element && root.shadowRoot) {
                value.full += createTextContent(root.shadowRoot).full;
            }
            if (!observedNodes.has(root)) {
                textChangeObserver.observe(root, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
                observedNodes.add(root);
            }
        }
        textContentCache.set(root, value);
        return value;
    };

    /**
     * @license
     * Copyright 2022 Google Inc.
     * SPDX-License-Identifier: Apache-2.0
     */
    /**
     * Queries the given node for all nodes matching the given text selector.
     *
     * @internal
     */
    const textQuerySelectorAll = function* (root, selector) {
        let yielded = false;
        for (const node of root.childNodes) {
            if (node instanceof Element && isSuitableNodeForTextMatching(node)) {
                let matches;
                if (!node.shadowRoot) {
                    matches = textQuerySelectorAll(node, selector);
                }
                else {
                    matches = textQuerySelectorAll(node.shadowRoot, selector);
                }
                for (const match of matches) {
                    yield match;
                    yielded = true;
                }
            }
        }
        if (yielded) {
            return;
        }
        if (root instanceof Element && isSuitableNodeForTextMatching(root)) {
            const textContent = createTextContent(root);
            if (textContent.full.includes(selector)) {
                yield root;
            }
        }
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    const MINIMUM_TEXT_LENGTH = 12;
    const MAXIMUM_TEXT_LENGTH = 64;
    const collect = (iter, max = Infinity) => {
        const results = [];
        for (const value of iter) {
            if (max <= 0) {
                break;
            }
            results.push(value);
            --max;
        }
        return results;
    };
    /**
     * Computes the text selector for a node.
     *
     * @param node - The node to compute.
     * @returns The computed text selector.
     *
     * @internal
     */
    const computeTextSelector = (node) => {
        const content = createTextContent(node).full.trim();
        if (!content) {
            return;
        }
        // If it's short, just return it.
        if (content.length <= MINIMUM_TEXT_LENGTH) {
            const elements = collect(textQuerySelectorAll(document, content), 2);
            if (elements.length !== 1 || elements[0] !== node) {
                return;
            }
            return [content];
        }
        // If it's too long, it's probably irrelevant.
        if (content.length > MAXIMUM_TEXT_LENGTH) {
            return;
        }
        // We do a binary search for the optimal length of a substring starting at 0.
        let left = MINIMUM_TEXT_LENGTH;
        let right = content.length;
        while (left <= right) {
            const center = left + ((right - left) >> 2);
            const elements = collect(textQuerySelectorAll(document, content.slice(0, center)), 2);
            if (elements.length !== 1 || elements[0] !== node) {
                left = center + 1;
            }
            else {
                right = center - 1;
            }
        }
        // Never matched.
        if (right === content.length) {
            return;
        }
        // We attempt to round the word in the event we are in the middle of a word.
        const length = right + 1;
        const remainder = content.slice(length, length + MAXIMUM_TEXT_LENGTH);
        return [content.slice(0, length + remainder.search(/ |$/))];
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    const attributeSelector = (name, value) => {
        return `//*[@${name}=${JSON.stringify(value)}]`;
    };
    const getSelectorPart = (node, optimized, attributes = []) => {
        let value;
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                if (!(node instanceof Element)) {
                    return;
                }
                if (optimized) {
                    for (const attribute of attributes) {
                        value = node.getAttribute(attribute) ?? '';
                        if (value) {
                            return new SelectorPart(attributeSelector(attribute, value), true);
                        }
                    }
                }
                if (node.id) {
                    return new SelectorPart(attributeSelector('id', node.id), true);
                }
                value = node.localName;
                break;
            case Node.ATTRIBUTE_NODE:
                value = '@' + node.nodeName;
                break;
            case Node.TEXT_NODE:
            case Node.CDATA_SECTION_NODE:
                value = 'text()';
                break;
            case Node.PROCESSING_INSTRUCTION_NODE:
                value = 'processing-instruction()';
                break;
            case Node.COMMENT_NODE:
                value = 'comment()';
                break;
            case Node.DOCUMENT_NODE:
                value = '';
                break;
            default:
                value = '';
                break;
        }
        const index = getXPathIndexInParent(node);
        if (index > 0) {
            value += `[${index}]`;
        }
        return new SelectorPart(value, node.nodeType === Node.DOCUMENT_NODE);
    };
    const getXPathIndexInParent = (node) => {
        /**
         * @returns -1 in case of error, 0 if no siblings matching the same expression,
         * XPath index among the same expression-matching sibling nodes otherwise.
         */
        function areNodesSimilar(left, right) {
            if (left === right) {
                return true;
            }
            if (left instanceof Element && right instanceof Element) {
                return left.localName === right.localName;
            }
            if (left.nodeType === right.nodeType) {
                return true;
            }
            // XPath treats CDATA as text nodes.
            const leftType = left.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : left.nodeType;
            const rightType = right.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : right.nodeType;
            return leftType === rightType;
        }
        const children = node.parentNode ? node.parentNode.children : null;
        if (!children) {
            return 0;
        }
        let hasSameNamedElements;
        for (let i = 0; i < children.length; ++i) {
            if (areNodesSimilar(node, children[i]) && children[i] !== node) {
                hasSameNamedElements = true;
                break;
            }
        }
        if (!hasSameNamedElements) {
            return 0;
        }
        let ownIndex = 1; // XPath indices start with 1.
        for (let i = 0; i < children.length; ++i) {
            if (areNodesSimilar(node, children[i])) {
                if (children[i] === node) {
                    return ownIndex;
                }
                ++ownIndex;
            }
        }
        throw new Error('This is impossible; a child must be the child of the parent');
    };
    /**
     * Computes the XPath for a node.
     *
     * @param node - The node to compute.
     * @param optimized - Whether to optimize the XPath for the node. Does not imply
     * the XPath is shorter; implies the XPath will be highly-scoped to the node.
     * @returns The computed XPath.
     *
     * @internal
     */
    const computeXPath = (node, optimized, attributes) => {
        if (node.nodeType === Node.DOCUMENT_NODE) {
            return '/';
        }
        const selectors = [];
        const buffer = [];
        let contextNode = node;
        while (contextNode !== document && contextNode) {
            const part = getSelectorPart(contextNode, optimized, attributes);
            if (!part) {
                return;
            }
            buffer.unshift(part);
            if (part.optimized) {
                contextNode = contextNode.getRootNode();
            }
            else {
                contextNode = contextNode.parentNode;
            }
            if (contextNode instanceof ShadowRoot) {
                selectors.unshift((buffer[0].optimized ? '' : '/') + buffer.join('/'));
                buffer.splice(0, buffer.length);
                contextNode = contextNode.host;
            }
        }
        if (buffer.length) {
            selectors.unshift((buffer[0].optimized ? '' : '/') + buffer.join('/'));
        }
        if (!selectors.length || selectors.length > 1) {
            // XPath evaluation does not work on shadowRoot.
            return;
        }
        return selectors;
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    const prefixSelector = (selector, prefix) => {
        if (selector === undefined) {
            return;
        }
        if (typeof selector === 'string') {
            return `${prefix}/${selector}`;
        }
        return selector.map(selector => `${prefix}/${selector}`);
    };
    class SelectorComputer {
        #customAttributes = [
            // Most common attributes first.
            'data-testid',
            'data-test',
            'data-qa',
            'data-cy',
            'data-test-id',
            'data-qa-id',
            'data-testing',
        ];
        #bindings;
        #logger;
        #nodes = new MonotonicArray();
        #selectorFunctionsInOrder;
        constructor(bindings, logger, customAttribute = '', selectorTypesToRecord) {
            this.#bindings = bindings;
            this.#logger = logger;
            let selectorOrder = [
                'aria',
                'css',
                'xpath',
                'pierce',
                'text',
            ];
            if (customAttribute) {
                // Custom DOM attributes indicate a preference for CSS/XPath selectors.
                this.#customAttributes.unshift(customAttribute);
                selectorOrder = [
                    'css',
                    'xpath',
                    'pierce',
                    'aria',
                    'text',
                ];
            }
            this.#selectorFunctionsInOrder = selectorOrder
                .filter(type => {
                if (selectorTypesToRecord) {
                    return selectorTypesToRecord.includes(type);
                }
                return true;
            })
                .map(selectorType => {
                switch (selectorType) {
                    case 'css':
                        return this.getCSSSelector.bind(this);
                    case 'xpath':
                        return this.getXPathSelector.bind(this);
                    case 'pierce':
                        return this.getPierceSelector.bind(this);
                    case 'aria':
                        return this.getARIASelector.bind(this);
                    case 'text':
                        return this.getTextSelector.bind(this);
                    default:
                        throw new Error('Unknown selector type: ' + selectorType);
                }
            });
        }
        getSelectors(node) {
            const selectors = [];
            for (const getSelector of this.#selectorFunctionsInOrder) {
                const selector = getSelector(node);
                if (selector) {
                    selectors.push(selector);
                }
            }
            return selectors;
        }
        getCSSSelector(node) {
            return this.#logger.timed(`getCSSSelector: ${this.#nodes.getOrInsert(node)} ${node.nodeName}`, () => {
                return computeCSSSelector(node, this.#customAttributes);
            });
        }
        getTextSelector(node) {
            return this.#logger.timed(`getTextSelector: ${this.#nodes.getOrInsert(node)} ${node.nodeName}`, () => {
                return prefixSelector(computeTextSelector(node), 'text');
            });
        }
        getXPathSelector(node) {
            return this.#logger.timed(`getXPathSelector: ${this.#nodes.getOrInsert(node)} ${node.nodeName}`, () => {
                return prefixSelector(computeXPath(node, true, this.#customAttributes), 'xpath');
            });
        }
        getPierceSelector(node) {
            return this.#logger.timed(`getPierceSelector: ${this.#nodes.getOrInsert(node)} ${node.nodeName}`, () => {
                return prefixSelector(computePierceSelector(node, this.#customAttributes), 'pierce');
            });
        }
        getARIASelector(node) {
            return this.#logger.timed(`getARIASelector: ${this.#nodes.getOrInsert(node)} ${node.nodeName}`, () => {
                return prefixSelector(computeARIASelector(node, this.#bindings), 'aria');
            });
        }
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    function assert(condition) {
        if (!condition) {
            throw new Error('Assertion failed!');
        }
    }
    const haultImmediateEvent = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    const getMouseEventOffsets = (event, target) => {
        const rect = target.getBoundingClientRect();
        return { offsetX: event.clientX - rect.x, offsetY: event.clientY - rect.y };
    };
    /**
     * @returns the element that emitted the event.
     */
    const getClickableTargetFromEvent = (event) => {
        for (const element of event.composedPath()) {
            if (!(element instanceof Element)) {
                continue;
            }
            // If an element has no width or height, we skip this target.
            const rect = element.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                continue;
            }
            return element;
        }
        throw new Error(`No target is found in event of type ${event.type}`);
    };
    const createClickAttributes = (event, target) => {
        let deviceType;
        if (event instanceof PointerEvent) {
            switch (event.pointerType) {
                case 'mouse':
                    // Default device.
                    break;
                case 'pen':
                case 'touch':
                    deviceType = event.pointerType;
                    break;
                default:
                    // Unsupported device type.
                    return;
            }
        }
        const { offsetX, offsetY } = getMouseEventOffsets(event, target);
        if (offsetX < 0 || offsetY < 0) {
            // Event comes from outside the viewport. Can happen as a result of a
            // simulated click (through a keyboard event e.g.).
            return;
        }
        return {
            button: ['auxiliary', 'secondary', 'back', 'forward'][event.button - 1],
            deviceType,
            offsetX,
            offsetY,
        };
    };

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    /**
     * Determines whether an element is ignorable as an input.
     *
     * This is only called on input-like elements (elements that emit the `input`
     * event).
     *
     * With every `if` statement, please write a comment above explaining your
     * reasoning for ignoring the event.
     */
    const isIgnorableInputElement = (element) => {
        if (element instanceof HTMLInputElement) {
            switch (element.type) {
                // Checkboxes are always changed as a consequence of another type of action
                // such as the keyboard or mouse. As such, we can safely ignore these
                // elements.
                case 'checkbox':
                    return true;
                // Radios are always changed as a consequence of another type of action
                // such as the keyboard or mouse. As such, we can safely ignore these
                // elements.
                case 'radio':
                    return true;
            }
        }
        return false;
    };
    const getShortcutLength = (shortcut) => {
        return Object.values(shortcut).filter(key => Boolean(key)).length.toString();
    };
    class RecordingClient {
        static defaultSetupOptions = Object.freeze({
            debug: false,
            allowUntrustedEvents: false,
            selectorTypesToRecord: [
                'aria',
                'css',
                'text',
                'xpath',
                'pierce',
            ],
        });
        #computer;
        #isTrustedEvent = (event) => event.isTrusted;
        #stopShortcuts = [];
        #logger;
        constructor(bindings, options = RecordingClient.defaultSetupOptions) {
            this.#logger = new Logger(options.debug ? 'debug' : 'silent');
            this.#logger.log('creating a RecordingClient');
            this.#computer = new SelectorComputer(bindings, this.#logger, options.selectorAttribute, options.selectorTypesToRecord);
            if (options.allowUntrustedEvents) {
                this.#isTrustedEvent = () => true;
            }
            this.#stopShortcuts = options.stopShortcuts ?? [];
        }
        start = () => {
            this.#logger.log('Setting up recording listeners');
            window.addEventListener('keydown', this.#onKeyDown, true);
            window.addEventListener('beforeinput', this.#onBeforeInput, true);
            window.addEventListener('input', this.#onInput, true);
            window.addEventListener('keyup', this.#onKeyUp, true);
            window.addEventListener('pointerdown', this.#onPointerDown, true);
            window.addEventListener('click', this.#onClick, true);
            window.addEventListener('auxclick', this.#onClick, true);
            window.addEventListener('beforeunload', this.#onBeforeUnload, true);
        };
        stop = () => {
            this.#logger.log('Tearing down client listeners');
            window.removeEventListener('keydown', this.#onKeyDown, true);
            window.removeEventListener('beforeinput', this.#onBeforeInput, true);
            window.removeEventListener('input', this.#onInput, true);
            window.removeEventListener('keyup', this.#onKeyUp, true);
            window.removeEventListener('pointerdown', this.#onPointerDown, true);
            window.removeEventListener('click', this.#onClick, true);
            window.removeEventListener('auxclick', this.#onClick, true);
            window.removeEventListener('beforeunload', this.#onBeforeUnload, true);
        };
        getSelectors = (node) => {
            return this.#computer.getSelectors(node);
        };
        getCSSSelector = (node) => {
            return this.#computer.getCSSSelector(node);
        };
        getTextSelector = (node) => {
            return this.#computer.getTextSelector(node);
        };
        queryCSSSelectorAllForTesting = (selector) => {
            return queryCSSSelectorAll(selector);
        };
        #wasStopShortcutPress = (event) => {
            for (const shortcut of this.#stopShortcuts ?? []) {
                if (event.shiftKey === shortcut.shift && event.ctrlKey === shortcut.ctrl && event.metaKey === shortcut.meta &&
                    event.keyCode === shortcut.keyCode) {
                    this.stop();
                    haultImmediateEvent(event);
                    window.stopShortcut(getShortcutLength(shortcut));
                    return true;
                }
            }
            return false;
        };
        #initialInputTarget = { element: document.documentElement, selectors: [] };
        /**
         * Sets the current input target and computes the selector.
         *
         * This needs to be called before any input-related events (keydown, keyup,
         * input, change, etc) occur so the precise selector is known. Since we
         * capture on the `Window`, it suffices to call this on the first event in any
         * given input sequence. This will always be either `keydown`, `beforeinput`,
         * or `input`.
         */
        #setInitialInputTarget = (event) => {
            const element = event.composedPath()[0];
            assert(element instanceof Element);
            if (this.#initialInputTarget.element === element) {
                return;
            }
            this.#initialInputTarget = { element, selectors: this.getSelectors(element) };
        };
        #onKeyDown = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            if (this.#wasStopShortcutPress(event)) {
                return;
            }
            this.#setInitialInputTarget(event);
            this.#addStep({
                type: 'keyDown',
                key: event.key,
            });
        };
        #onBeforeInput = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#setInitialInputTarget(event);
        };
        #onInput = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#setInitialInputTarget(event);
            if (isIgnorableInputElement(this.#initialInputTarget.element)) {
                return;
            }
            const { element, selectors } = this.#initialInputTarget;
            this.#addStep({
                type: 'change',
                selectors,
                value: 'value' in element ? element.value : element.textContent,
            });
        };
        #onKeyUp = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#addStep({
                type: 'keyUp',
                key: event.key,
            });
        };
        #initialPointerTarget = {
            element: document.documentElement,
            selectors: [],
        };
        #setInitialPointerTarget = (event) => {
            const element = getClickableTargetFromEvent(event);
            if (this.#initialPointerTarget.element === element) {
                return;
            }
            this.#initialPointerTarget = {
                element,
                selectors: this.#computer.getSelectors(element),
            };
        };
        #pointerDownTimestamp = 0;
        #onPointerDown = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#pointerDownTimestamp = event.timeStamp;
            this.#setInitialPointerTarget(event);
        };
        #onClick = (event) => {
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#setInitialPointerTarget(event);
            const attributes = createClickAttributes(event, this.#initialPointerTarget.element);
            if (!attributes) {
                return;
            }
            const duration = event.timeStamp - this.#pointerDownTimestamp;
            this.#addStep({
                type: event.detail === 2 ? 'doubleClick' : 'click',
                selectors: this.#initialPointerTarget.selectors,
                duration: duration > 350 ? duration : undefined,
                ...attributes,
            });
        };
        #onBeforeUnload = (event) => {
            this.#logger.log('Unloading...');
            if (!this.#isTrustedEvent(event)) {
                return;
            }
            this.#addStep({ type: 'beforeUnload' });
        };
        #addStep = (step) => {
            const payload = JSON.stringify(step);
            this.#logger.log(`Adding step: ${payload}`);
            window.addStep(payload);
        };
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class SelectorPicker {
        #logger;
        #computer;
        constructor(bindings, customAttribute = '', debug = true) {
            this.#logger = new Logger(debug ? 'debug' : 'silent');
            this.#logger.log('Creating a SelectorPicker');
            this.#computer = new SelectorComputer(bindings, this.#logger, customAttribute);
        }
        #handleClickEvent = (event) => {
            haultImmediateEvent(event);
            const target = getClickableTargetFromEvent(event);
            window.captureSelectors(JSON.stringify({
                selectors: this.#computer.getSelectors(target),
                ...getMouseEventOffsets(event, target),
            }));
        };
        start = () => {
            this.#logger.log('Setting up selector listeners');
            window.addEventListener('click', this.#handleClickEvent, true);
            window.addEventListener('mousedown', haultImmediateEvent, true);
            window.addEventListener('mouseup', haultImmediateEvent, true);
        };
        stop = () => {
            this.#logger.log('Tearing down selector listeners');
            window.removeEventListener('click', this.#handleClickEvent, true);
            window.removeEventListener('mousedown', haultImmediateEvent, true);
            window.removeEventListener('mouseup', haultImmediateEvent, true);
        };
    }

    // Copyright 2023 The Chromium Authors. All rights reserved.
    // Use of this source code is governed by a BSD-style license that can be
    // found in the LICENSE file.
    class DevToolsRecorder {
        #recordingClient;
        startRecording(bindings, options) {
            if (this.#recordingClient) {
                throw new Error('Recording client already started.');
            }
            if (this.#selectorPicker) {
                throw new Error('Selector picker is active.');
            }
            this.#recordingClient = new RecordingClient(bindings, options);
            this.#recordingClient.start();
        }
        stopRecording() {
            if (!this.#recordingClient) {
                throw new Error('Recording client was not started.');
            }
            this.#recordingClient.stop();
            this.#recordingClient = undefined;
        }
        get recordingClientForTesting() {
            if (!this.#recordingClient) {
                throw new Error('Recording client was not started.');
            }
            return this.#recordingClient;
        }
        #selectorPicker;
        startSelectorPicker(bindings, customAttribute, debug) {
            if (this.#selectorPicker) {
                throw new Error('Selector picker already started.');
            }
            if (this.#recordingClient) {
                this.#recordingClient.stop();
            }
            this.#selectorPicker = new SelectorPicker(bindings, customAttribute, debug);
            this.#selectorPicker.start();
        }
        stopSelectorPicker() {
            if (!this.#selectorPicker) {
                throw new Error('Selector picker was not started.');
            }
            this.#selectorPicker.stop();
            this.#selectorPicker = undefined;
            if (this.#recordingClient) {
                this.#recordingClient.start();
            }
        }
    }
    if (!window.DevToolsRecorder) {
        window.DevToolsRecorder = new DevToolsRecorder();
    }

})();
