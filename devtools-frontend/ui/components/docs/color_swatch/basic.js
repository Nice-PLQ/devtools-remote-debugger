// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Common from '../../../../core/common/common.js';
import * as FrontendHelpers from '../../../../testing/EnvironmentHelpers.js';
import * as InlineEditor from '../../../legacy/components/inline_editor/inline_editor.js';
import * as ComponentHelpers from '../../helpers/helpers.js';
await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();
function appendExample(swatch) {
    const li = document.createElement('li');
    li.appendChild(swatch);
    document.querySelector('#container')?.appendChild(li);
}
// Simple
let component = new InlineEditor.ColorSwatch.ColorSwatch();
component.renderColor(Common.Color.parse('#f06'));
appendExample(component);
// No text next to the swatch
component = new InlineEditor.ColorSwatch.ColorSwatch();
component.renderColor(Common.Color.parse('gold'));
let content = document.createElement('span');
content.textContent = '';
component.appendChild(content);
appendExample(component);
// Custom content
component = new InlineEditor.ColorSwatch.ColorSwatch();
component.renderColor(Common.Color.parse('rebeccapurple'));
content = document.createElement('span');
content.textContent = 'custom content';
component.appendChild(content);
appendExample(component);
//# sourceMappingURL=basic.js.map