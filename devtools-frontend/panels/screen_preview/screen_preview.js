import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';

let screenPreviewPanelInstance;
export class ScreenPreviewPanel extends UI.Widget.VBox {
  started = false;
  startPreviewed = false;
  messages = [];
  constructor() {
    super(true);
    this.rendeHtml();
  }
  static instance() {
    if (!screenPreviewPanelInstance) {
      screenPreviewPanelInstance = new ScreenPreviewPanel();
    }
    return screenPreviewPanelInstance;
  }
  onSend(command, params = {}) {
    const test = ProtocolClient.InspectorBackend.test;
    test.sendRawMessage(command, params);
  };
  wasShown() {
    if (this.started) {
      return;
    }
    this.started = true;
    const test = ProtocolClient.InspectorBackend.test;
    test.onMessageReceived = this.messageReceived.bind(this);
  }
  willHide() {
    this.onSend('ScreenPreview.stopPreview');
    this.previewBtn.innerText = 'Live Preview';
    this.startPreviewed = false;
  }
  messageReceived(message) {
    const { method, params } = message;

    if (method === 'ScreenPreview.captured') {
      this.renderPreview(params);
    }

    if (method === 'ScreenPreview.syncScroll') {
      this.syncScroll(params);
    }

  }
  syncScroll({ scrollLeft, scrollTop }) {
    this.iframe.contentWindow.scrollTo(scrollLeft, scrollTop);
  }
  renderPreview({ isMobile, width, height, head, body }) {
    const iframeContent = this.iframe.contentDocument || this.iframe.contentWindow.document;

    head && (iframeContent.head.innerHTML = head);
    iframeContent.body.innerHTML = body;
    if (isMobile) {
      this.iframe.style.cssText = `width:${width}px;height:${height}px;`;
    } else {
      this.iframe.style.cssText = `width:${width * 0.75}px;max-width:1200px;height:${height * 0.75}px;max-height:1000px`;
    }
    this.iframe.style.border = '10px solid var(--color-details-hairline)';
    this.iframe.style.borderRadius = '10px';
    this.iframe.style.boxSizing = 'content-box';
    this.iframe.style.pointerEvents = 'none';
  }
  rendeHtml() {
    const preview = ({ target }) => {
      if (this.startPreviewed) {
        this.startPreviewed = false;
        target.innerText = 'Live Preview';
        this.onSend('ScreenPreview.stopPreview');
      } else {
        this.startPreviewed = true;
        target.innerText = 'Stop';
        this.onSend('ScreenPreview.startPreview');
      }
    }

    this.previewBtn = document.createElement('button');
    this.previewBtn.innerText = 'Live Preview';
    this.previewBtn.onclick = preview;

    this.iframe = document.createElement('iframe');
    this.iframe.style.borderRadius = '10px';
    this.iframe.srcdoc = '<html><head></head><body></body></html>'
    this.container = document.createElement('div');

    const dom = LitHtml.html`
      <style>
        .preview-container {
          display:flex;
          flex-direction:column;
          justify-content:center;
          align-items:center;
          flex:1;
        }
      </style>
      <div class="preview-container">
        <div style="margin-bottom:16px;">
          ${this.previewBtn}
        </div>
        <div style="position:relative">
          ${this.iframe}
        </div>
      </div>
    `;

    LitHtml.render(dom, this.contentElement);
  }
}
