import * as UI from '../../ui/legacy/legacy.js';

let loadedScreenPreviewModule;
async function loadScreenPreviewModule() {
    if (!loadedScreenPreviewModule) {
        loadedScreenPreviewModule = await import('./screen_preview.js');
    }
    return loadedScreenPreviewModule;
}

UI.ViewManager.registerViewExtension({
    location: 'panel' /* PANEL */,
    id: 'screenPreview',
    commandPrompt: () => 'ScreenPreview',
    title: () => 'ScreenPreview',
    order: 9999,
    async loadView() {
        const ScreenPreview = await loadScreenPreviewModule();
        return ScreenPreview.ScreenPreviewPanel.instance()
    },
});
