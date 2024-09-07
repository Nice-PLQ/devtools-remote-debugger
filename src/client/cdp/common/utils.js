/**
 * get absolute path
 * @param {String} url
 */
export function getAbsolutePath(url) {
  if (!url || typeof url !== 'string') return '';
  const a = document.createElement('a');
  a.href = url;
  return a.href;
}

export function key2UpperCase(key) {
  return key.replace(/^\S|-[a-z]/g, s => s.toUpperCase());
}

export function isMatches(element, selector) {
  // When some selectors in the safair kernel cannot be parsed, calling the matches method will throw an exception, which is captured here
  try {
    if (element.matches) {
      return element.matches(selector);
    }
    // deprecated
    if (element.webkitMatchesSelector) {
      return element.webkitMatchesSelector(selector);
    }
    if (element.mozMatchesSelector) {
      return element.mozMatchesSelector(selector);
    }
  } catch {
    return false;
  }
}

export function isMobile() {
  return /ios|iphone|ipod|android/.test(navigator.userAgent.toLowerCase());
}

export function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function escapeRegString(string) {
  return string.replace(/[\\\$\*\+\.\?\^\|\(\)\[\]\{\}]/g, (i) => `\\${i}`);
}
