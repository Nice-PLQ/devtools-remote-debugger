import html2canvas from 'html2canvas';
import { isMatches, isMobile, isMobile } from '../common/utils';
import BaseDomain from './domain';
import { Event } from './protocol';

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
  startPreview() {
    const isMobile = isMobile();
    const selector = 'link[rel="stylesheet"],style';
    const styles = document.querySelectorAll(selector);
    let counts = styles.length;

    const joinStyleTags = (styles) => {
      let tags = '';
      Array.from(styles).forEach(style => {
        const tag = style.tagName.toLowerCase();

        if (tag === 'link') {
          tags += `<link href="${style.href}" rel="stylesheet">`;
        }

        if (tag === 'style') {
          tags += `<style>${style.innerHTML}</style>`
        }
      });
      return `<head>${tags}</head>`;
    };

    this.send({
      method: Event.captured,
      params: {
        isMobile,
        head: joinStyleTags(styles),
        body: document.body.innerHTML,
        width: window.innerWidth,
        height: window.innerHeight,
      }
    });

    // Observe the changes of the document
    const observer = new MutationObserver(() => {
      const curStyles = document.querySelectorAll(selector);
      let head;
      if (curStyles.length !== counts) {
        counts = curStyles.length;
        head = joinStyleTags(curStyles);
      }

      this.send({
        method: Event.captured,
        params: {
          isMobile,
          head,
          body: document.body.innerHTML,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
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
