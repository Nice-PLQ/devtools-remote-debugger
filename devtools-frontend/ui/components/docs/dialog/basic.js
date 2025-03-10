// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as FrontendHelpers from '../../../../testing/EnvironmentHelpers.js';
import * as Dialogs from '../../../../ui/components/dialogs/dialogs.js';
import * as ComponentHelpers from '../../helpers/helpers.js';
await ComponentHelpers.ComponentServerSetup.setup();
await FrontendHelpers.initializeGlobalVars();
const verticalPositions = ["top" /* Dialogs.Dialog.DialogVerticalPosition.TOP */, "bottom" /* Dialogs.Dialog.DialogVerticalPosition.BOTTOM */];
const horizontalAlignments = [
    "auto" /* Dialogs.Dialog.DialogHorizontalAlignment.AUTO */,
    "left" /* Dialogs.Dialog.DialogHorizontalAlignment.LEFT */,
    "center" /* Dialogs.Dialog.DialogHorizontalAlignment.CENTER */,
    "right" /* Dialogs.Dialog.DialogHorizontalAlignment.RIGHT */,
    "auto" /* Dialogs.Dialog.DialogHorizontalAlignment.AUTO */,
];
const root = document.getElementById('root');
let i = 0;
for (const verticalPosition of verticalPositions) {
    const row = document.createElement('div');
    row.classList.add('row');
    root.appendChild(row);
    for (const horizontalAlignment of horizontalAlignments) {
        const dialog = new Dialogs.Dialog.Dialog();
        const container = document.createElement('div');
        container.classList.add('container');
        container.id = `container-${i}`;
        const host = document.createElement('div');
        host.classList.add('dialog-host');
        host.id = `host-${i}`;
        host.textContent = 'Hover me';
        container.appendChild(host);
        row.appendChild(container);
        dialog.position = verticalPosition;
        dialog.horizontalAlignment = horizontalAlignment;
        dialog.origin = host;
        dialog.id = `dialog-${i}`;
        host.addEventListener('mouseover', () => {
            void dialog.setDialogVisible(true);
        });
        dialog.addEventListener('clickoutsidedialog', () => {
            void dialog.setDialogVisible(false);
        });
        const div = document.createElement('div');
        div.classList.add('dialog-content');
        div.style.padding = '0 1em';
        div.innerHTML =
            `Hello, World<br/>Vertical position: ${verticalPosition}<br/>Horizontal alignment: ${horizontalAlignment}`;
        dialog.appendChild(div);
        root.appendChild(dialog);
        i++;
    }
}
for (const verticalPosition of verticalPositions) {
    const row = document.createElement('div');
    row.classList.add('row');
    root.appendChild(row);
    for (const horizontalAlignment of horizontalAlignments) {
        const dialog = new Dialogs.Dialog.Dialog();
        const container = document.createElement('div');
        container.classList.add('container');
        container.id = `container-${i}`;
        const host = document.createElement('div');
        host.classList.add('dialog-host-narrow');
        host.id = `host-${i}`;
        host.textContent = 'H';
        container.appendChild(host);
        row.appendChild(container);
        dialog.position = verticalPosition;
        dialog.horizontalAlignment = horizontalAlignment;
        dialog.origin = host;
        dialog.id = `dialog-${i}`;
        host.addEventListener('mouseover', () => {
            void dialog.setDialogVisible(true);
        });
        dialog.addEventListener('clickoutsidedialog', () => {
            void dialog.setDialogVisible(false);
        });
        const div = document.createElement('div');
        div.classList.add('dialog-content');
        div.style.padding = '0 1em';
        div.innerHTML = `Hello, World<br/>Show connector: true<br/>Vertical position: ${verticalPosition}<br/>Horizontal alignment: ${horizontalAlignment}`;
        dialog.appendChild(div);
        root.appendChild(dialog);
        i++;
    }
}
renderDifferentModeExample();
function renderDifferentModeExample() {
    const row = document.createElement('div');
    row.classList.add('row');
    root.appendChild(row);
    renderDialogWithTitle();
    renderDialogWithTitleAndCloseButton();
    renderDialogWithoutTitleOrCloseButton();
    function renderDialog() {
        const dialog = new Dialogs.Dialog.Dialog();
        const container = document.createElement('div');
        container.classList.add('container');
        container.id = `container-${i}`;
        const host = document.createElement('div');
        host.classList.add('dialog-host-narrow');
        host.id = `host-${i}`;
        host.textContent = 'H';
        container.appendChild(host);
        row.appendChild(container);
        dialog.position = "bottom" /* Dialogs.Dialog.DialogVerticalPosition.BOTTOM */;
        dialog.horizontalAlignment = "auto" /* Dialogs.Dialog.DialogHorizontalAlignment.AUTO */;
        dialog.origin = host;
        dialog.id = `dialog-${i}`;
        host.addEventListener('mouseover', () => {
            void dialog.setDialogVisible(true);
        });
        dialog.addEventListener('clickoutsidedialog', () => {
            void dialog.setDialogVisible(false);
        });
        const div = document.createElement('div');
        div.classList.add('dialog-content');
        div.style.padding = '0 var(--sys-size-8)';
        div.innerHTML = 'Hello, World';
        dialog.appendChild(div);
        root.appendChild(dialog);
        i++;
        return dialog;
    }
    function renderDialogWithTitle() {
        const dialog = renderDialog();
        dialog.dialogTitle = 'title';
    }
    function renderDialogWithTitleAndCloseButton() {
        const dialog = renderDialog();
        dialog.dialogTitle = 'title';
        dialog.closeButton = true;
    }
    function renderDialogWithoutTitleOrCloseButton() {
        renderDialog();
    }
}
//# sourceMappingURL=basic.js.map