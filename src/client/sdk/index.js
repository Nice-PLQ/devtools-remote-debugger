import uuid from 'string-random';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getAbsolutePath } from './common/utils';
import ChromeDomain from './domain/index';

function getDocumentFavicon() {
  const links = document.head.querySelectorAll('link');
  const icon = Array.from(links).find((link) => {
    const rel = link.getAttribute('rel');
    return rel.includes('icon') || rel.includes('shortcut');
  });

  let iconUrl = '';
  if (icon) {
    iconUrl = getAbsolutePath(icon.getAttribute('href'));
  }

  return iconUrl;
}

// debug id
function getId() {
  let id = sessionStorage.getItem('debug_id');
  if (!id) {
    id = uuid();
    sessionStorage.setItem('debug_id', id);
  }

  return id;
}

function getQuery() {
  const search = new URLSearchParams();
  search.append('url', location.href);
  search.append('title', document.title);
  search.append('favicon', getDocumentFavicon());
  search.append('time', Date.now());
  search.append('ua', navigator.userAgent);
  return search.toString();
}

function initSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.DEBUG_HOST.replace(/^(http|https):\/\//ig, '');
  const socket = new ReconnectingWebSocket(`${protocol}//${host}/remote/debug/client/${getId()}?${getQuery()}`);
  const domain = new ChromeDomain({ socket });

  socket.addEventListener('message', ({ data }) => {
    try {
      const message = JSON.parse(data);
      const ret = domain.execute(message);
      socket.send(JSON.stringify(ret));
    } catch (e) {
      console.log(e);
    }
  });

  let heartbeat;
  socket.addEventListener('open', () => {
    // Heartbeat keep alive
    heartbeat = setInterval(() => {
      socket.send('{}');
    }, 10000);
  });

  socket.addEventListener('close', () => {
    clearInterval(heartbeat);
  });
  socket.addEventListener('error', () => {
    clearInterval(heartbeat);
  });
}

function keepScreenDisplay() {
  if (!navigator.wakeLock) return;

  navigator.wakeLock.request('screen');

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.wakeLock.request('screen');
    }
  });
}

initSocket();
keepScreenDisplay();
