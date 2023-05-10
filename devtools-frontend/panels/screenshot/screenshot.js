import * as ProtocolClient from '../../core/protocol_client/protocol_client.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as LitHtml from '../../ui/lit-html/lit-html.js';
import { DiffDOM } from './diffDOM/index.js';

const dd = new DiffDOM({
  valueDiffing: true
});

let screenshotPanelInstance;
export class ScreenshotPanel extends UI.Widget.VBox {
  started = false;
  startPreviewed = false;
  messages = [];
  constructor() {
    super(true);
    this.contentElement.classList.add('screenshot-panel');
    this.rendeHtml();
  }
  static instance() {
    if (!screenshotPanelInstance) {
      screenshotPanelInstance = new ScreenshotPanel();
    }
    return screenshotPanelInstance;
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
    this.onSend('Screenshot.stopPreview');
    this.previewBtn.innerText = 'Live Preview';
    this.startPreviewed = false;
  }
  messageReceived(message) {
    const { method, params } = message;
    if (method !== 'Screenshot.captured') return;
    this.renderPreview(params);

  }
  renderPreview({ isMobile, width, height, head, body, headDiff, bodyDiff }) {
    const iframeContent = this.iframe.contentDocument || this.iframe.contentWindow.document;

    if (headDiff && bodyDiff) {
      dd.apply(iframeContent.head, headDiff);
      dd.apply(iframeContent.body, bodyDiff);
    } else {
      iframeContent.head.innerHTML = head;
      iframeContent.body.innerHTML = body;
      if (isMobile) {
        this.iframe.style.cssText = `width:${width}px;height:${height}px;pointer-events:none;`;
      } else {
        this.iframe.style.cssText = `width:${width * 0.75}px;max-width:1200px;height:${height * 0.75}px;max-height:1000px;pointer-events:none;`;
      }
    }
    this.iframe.style.border = '20px solid var(--color-details-hairline)';
    this.iframe.style.borderRadius = '20px';
    this.iframe.style.boxSizing = 'content-box';
  }
  rendeHtml() {
    const preview = ({ target }) => {
      if (this.startPreviewed) {
        this.startPreviewed = false;
        target.innerText = 'Live Preview';
        this.onSend('Screenshot.stopPreview');
      } else {
        this.startPreviewed = true;
        target.innerText = 'Stop';
        this.onSend('Screenshot.startPreview');
      }
    }

    const capture = () => {
      this.onSend('Screenshot.stopPreview');
      this.startPreviewed = false;
      this.previewBtn.innerText = 'Live Preview';
      this.onSend('Screenshot.getScreenshot');
    }

    this.previewBtn = document.createElement('button');
    this.previewBtn.innerText = 'Live Preview';
    this.previewBtn.onclick = preview;

    this.iframe = document.createElement('iframe');
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
        .preview-masker {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 99999999;
        }
      </style>
      <div class="preview-container">
        <div style="margin-bottom:16px;">
          ${this.previewBtn}
          <!-- <button style="margin-left:8px;" @click=${capture}>截图</button> -->
        </div>
        <div style="position:relative">
          ${this.iframe}
          <!-- <div class="preview-masker"></div> -->
        </div>
      </div>
    `;

    LitHtml.render(dom, this.contentElement);
  }
}
