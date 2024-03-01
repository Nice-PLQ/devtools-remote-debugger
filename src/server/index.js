const path = require('path');
const Koa = require('koa');
const KoaRouter = require('@koa/router');
const cors = require('@koa/cors');
const koaCompress = require('koa-compress');
const send = require('koa-send');
const notFound = require('./middleware/404');
const SocketServer = require('./socketServer');
const imageToBase64 = require('image-to-base64');

require('dotenv').config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === 'development' ? '.env.dev' : '.env'),
});

const prefix = '/remote/debug';

const compress = koaCompress({
  threshold: 2048,
  filter(contentType) {
    return ['application/javascript', 'application/json', 'text/css'].includes(contentType);
  },
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
  br: false,
});

async function start({ port, host } = {}) {
  const app = new Koa();
  const wss = new SocketServer();
  const router = getRouter(wss.clients);

  app.use(cors())
    .use(notFound)
    .use(router)
    .use(compress);

  const server = app.listen(port, host);
  wss.initSocketServer(server);

  console.log(`serve start at:  http://localhost:${port}\n\n`);
}

function getRouter(clients) {
  const router = new KoaRouter({ prefix });

  router.get('/index.html', async (ctx) => {
    await send(ctx, getFilePath(ctx.path), {
      root: path.resolve(__dirname, '../../dist/page'),
    });
  });

  router.get('/dist/(.*)', async (ctx) => {
    await send(ctx, getFilePath(ctx.path));
  });

  router.get('/front_end/(.*)', async (ctx) => {
    await send(ctx, getFilePath(ctx.path).substring(10), {
      root: path.resolve(__dirname, '../../devtools-frontend'),
      maxage: 30 * 24 * 60 * 60 * 1000,
    });
  });

  router.get('/json', async (ctx) => {
    const targets = Object.values(clients).map((item) => {
      const { ws, ...data } = item;
      return data;
    })
      .sort((a, b) => b.time - a.time);

    ctx.body = { targets };
  });

  router.get('/image_base64', async (ctx) => {
    const { url } = ctx.query;
    try {
      const base64 = await imageToBase64(url);
      ctx.body = { base64 };
    } catch {
      ctx.body = { base64: '' };
    }
  });

  // Routing for the example page
  router.get('/example/(.*)', async (ctx) => {
    await send(ctx, getFilePath(ctx.path));
  });

  return router.routes();
}

function getFilePath(path) {
  return path.replace(`${prefix}/`, '');
}

start({
  port: process.env.DEBUG_PORT,
});
