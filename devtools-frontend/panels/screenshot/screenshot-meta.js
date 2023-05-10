import * as UI from '../../ui/legacy/legacy.js';

let loadedScreenshotModule;
async function loadScreenshotkModule() {
    if (!loadedScreenshotModule) {
        loadedScreenshotModule = await import('./screenshot.js');
    }
    return loadedScreenshotModule;
}

UI.ViewManager.registerViewExtension({
    location: 'panel' /* PANEL */,
    id: 'screenshot',
    commandPrompt: () => 'Screenshot',
    title: () => 'Screenshot',
    order: 9999,
    async loadView() {
        const Screenshot = await loadScreenshotkModule();
        return Screenshot.ScreenshotPanel.instance()
    },
});
