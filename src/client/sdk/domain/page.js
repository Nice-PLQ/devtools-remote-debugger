import ScreenPreview from './screen-preview';
import BaseDomain from './domain';
import { Event } from './protocol';

export default class Page extends BaseDomain {
  namespace = 'Page';

  frame = new Map();

  /**

   * @public
   */
  enable() {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      this.frame.set(location.href, xhr.responseText);
    };
    xhr.onerror = () => {
      this.frame.set(location.href, 'Cannot get script source code');
    };

    xhr.open('GET', location.href);
    xhr.send();
  }

  /**
   * Get root frame
   * @public
   */
  getResourceTree() {
    return {
      frameTree: {
        frame: {
          id: 1,
          mimeType: 'text/html',
          securityOrigin: location.origin,
          url: location.href,
        },
        resources: [],
      },
    };
  }

  /**
   * Get html content
   * @public
   * @param {Object} param
   * @param {String} param.url page url
   */
  getResourceContent({ url }) {
    return {
      content: this.frame.get(url),
    };
  }

  startScreencast() {
    this.intervalTimer = setInterval(() => {
      if (document.hidden) return;
      ScreenPreview.captureScreen().then((base64) => {
        this.send({
          method: Event.screencastFrame,
          params: {
            data: base64.replace(/^data:image\/jpeg;base64,/, ''),
            sessionId: 1,
            metadata: {
              deviceHeight: window.innerHeight,
              deviceWidth: window.innerWidth,
              pageScaleFactor: 1,
              offsetTop: 0,
              scrollOffsetX: 0,
              scrollOffsetY: 0,
              timestamp: Date.now()
            }
          }
        });
      });
    }, 2000);
  }

  stopScreencast() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
};
