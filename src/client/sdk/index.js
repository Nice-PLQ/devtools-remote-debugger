import qs from 'query-string';
import uuid from 'string-random';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getAbsoultPath } from './common/utils';
import ChromeDomain from './domain/index';

function getDocumentFavicon() {
  const links = document.head.querySelectorAll('link');
  const icon = Array.from(links).find((link) => {
    const rel = link.getAttribute('rel');
    return rel.includes('icon') || rel.includes('shortcut');
  });

  let iconUrl = '';
  if (icon) {
    iconUrl = getAbsoultPath(icon.getAttribute('href'));
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

const query = qs.stringify({
  url: location.href,
  title: document.title,
  favicon: getDocumentFavicon(),
  time: Date.now(),
  ua: navigator.userAgent,
});

const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = process.env.DEBUG_HOST.replace(/^(http|https):\/\//ig, '');
const socket = new ReconnectingWebSocket(`${protocol}//${host}/remote/debug/client/${getId()}?${query}`);
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
