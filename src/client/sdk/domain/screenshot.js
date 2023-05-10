import html2canvas from 'html2canvas';
import { isMatches, isMobile } from '../common/utils';
import BaseDomain from './domain';
import { Event } from './protocol';

import { DiffDOM, nodeToObj } from '../diffDOM/index';

const dd = new DiffDOM({
  valueDiffing: true,
});

export default class Screenshot extends BaseDomain {
  namespace = 'Screenshot';

  intervalTimer = null;

  static captureScreen() {
    return html2canvas(document.body, {
      allowTaint: true,
      backgroundColor: null,
      useCORS: true,
      imageTimeout: 10000,
      scale: 1,
      ignoreElements: (element) => {
        if (!element?.style) return false;
        const { display, opacity, visibility } = element.style;
        return isMatches(element, '.devtools-overlay') ||
          display === 'none' ||
          opacity === 0 ||
          visibility === 'hidden';
      }
    }).then(canvas => canvas.toDataURL('image/jpeg'));
  }

  /**
   * Start live preview
   * @public
   */
  startPreview({ duration }) {
    this.send({
      method: Event.captured,
      params: {
        head: document.head.innerHTML,
        body: document.body.innerHTML,
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: isMobile(),
      }
    });

    let head = nodeToObj(document.head);
    let body = nodeToObj(document.body);
    this.intervalTimer = setInterval(() => {
      if (document.hidden) return;
      const currentHead = nodeToObj(document.head);
      const currentBody = nodeToObj(document.body);
      const headDiff = dd.diff(head, currentHead);
      const bodyDiff = dd.diff(body, currentBody);

      if (headDiff.length > 0 || bodyDiff.length > 0) {
        head = currentHead;
        body = currentBody;
        this.send({
          method: Event.captured,
          params: {
            headDiff,
            bodyDiff,
            isMobile: isMobile(),
          }
        });
      }
    }, duration || 500);
  }

  /**
   * stop live preview
   * @public
   */
  stopPreview() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }
}
