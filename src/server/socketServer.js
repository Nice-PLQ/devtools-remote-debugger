const WebSocket = require('ws');
const chalk = require('chalk');
const dayjs = require('dayjs');

const getTime = () => dayjs().format('YYYY-MM-DD HH:mm:ss');

class SocketServer {
  constructor() {
    this.clients = {};
    this.devtools = {};

    const wss = new WebSocket.Server({ noServer: true });
    this.wss = wss;
  }

  initSocketServer(server) {
    const { wss } = this;
    server.on('upgrade', (request, socket, head) => {
      const urlParse = new URL(request.url, 'http://0.0.0.0');
      const pathname = urlParse.pathname.replace('/remote/debug', '');
      const [, from, id] = pathname.split('/');

      if (from !== 'devtools' && from !== 'client') return;

      wss.handleUpgrade(request, socket, head, (ws) => {
        const { searchParams } = urlParse;

        // Create a connection for client sources
        if (from === 'client') {
          const pageUrl = searchParams.get('url');
          this.createClientSocketConnect(ws, {
            id,
            pageUrl,
            ua: searchParams.get('ua'),
            time: searchParams.get('time'),
            title: searchParams.get('title'),
            favicon: searchParams.get('favicon'),
          });
        } else {
          // Create a connection sourced from devtools
          this.createDevtoolsSocketConnect(ws, {
            id,
            clientId: searchParams.get('clientId'),
          });
        }
      });
    });
  }

  // Create a client ws connection
  createClientSocketConnect(ws, connectInfo) {
    const { id } = connectInfo;
    console.log(`${getTime()} ${chalk.bgCyan(chalk.black('client:'))} ${id} ${chalk.green('')}`);

    const sendToDevtools = (message) => {
      Object.values(this.devtools).forEach((devtool) => {
        if (devtool.clientId === id) {
          devtool.ws.send(message);
        }
      });
    };

    const closeToDevtools = () => {
      Object.values(this.devtools).forEach((devtool) => {
        if (devtool.clientId === id) {
          devtool.ws.close();
          delete this.devtools[devtool.id];
        }
      });
    };

    this.clients[id] = { ws, ...connectInfo };

    ws.on('message', sendToDevtools);
    ws.on('close', () => {
      console.log(`${getTime()} ${chalk.bgCyan(chalk.black('client:'))} ${id} ${chalk.red('disconnected')}`);
      delete this.clients[id];
      // After the client disconnects, clear the corresponding devtool connection
      closeToDevtools();
    });
  }

  // Create a devtools ws connection
  createDevtoolsSocketConnect(ws, connectInfo) {
    const { id, clientId } = connectInfo;
    console.log(`${getTime()} ${chalk.bgMagenta(chalk.black('devtools:'))} ${id} ${chalk.green('connected')}`);

    const client = this.clients[clientId];

    const devtool = { ws, client, ...connectInfo };
    this.devtools[id] = devtool;

    ws.on('close', () => {
      console.log(`${getTime()} ${chalk.bgMagenta(chalk.black('devtools:'))} ${id} ${chalk.red('disconnected')}`);
      delete this.devtools[id];
    });

    if (!client) return;

    ws.on('message', (message) => {
      client.ws.send(message);
    });
  }
}

module.exports = SocketServer;
