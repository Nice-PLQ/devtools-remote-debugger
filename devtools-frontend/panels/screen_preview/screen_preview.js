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

    if (method === 'ScreenPreview.syncMouse') {
      this.syncMouse(params);
    }
  }
  syncScroll({ scrollLeft, scrollTop }) {
    this.iframe.contentWindow.scrollTo(scrollLeft, scrollTop);
  }
  syncMouse({ type, left, top }) {
    this.mouse.style.top = `${top + 10}px`;
    this.mouse.style.left = `${left + 10}px`;
    this.mouse.style.display = 'block';

    if (type === 'mousedown' || type === 'touchstart') {
      this.mouse.style.transform = 'scale(0.8)';
    }

    if (type === 'mouseup' || type === 'touchend') {
      this.mouse.style.transform = 'none';
    }

    if (this.mouseTimer) {
      clearTimeout(this.mouseTimer);
      this.mouseTimer = null;
    }

    this.mouseTimer = setTimeout(() => {
      this.mouse.style.display = 'none'
    }, 3000);

  }
  renderPreview({ isMobile, width, height, head, body }) {
    const iframeContent = this.iframe.contentDocument || this.iframe.contentWindow.document;

    head && (iframeContent.head.innerHTML = head);
    iframeContent.body.innerHTML = body;
    // if (!isMobile) {
    //   width = width >= window.innerWidth ? window.innerWidth * 0.85 : width;
    //   height = height >= window.innerHeight ? window.innerHeight - 100 : height;
    // }
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
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

    this.mouse = document.createElement('div');
    this.mouse.style.cssText = 'display:none;position:absolute;top:10px;left:10px;width:20px;height:20px;border-radius:50%;border:2px solid #c2c2c2;background:rgba(0,0,0,0.4);';

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
          ${this.mouse}
        </div>
      </div>
    `;

    LitHtml.render(dom, this.contentElement);
  }
}
