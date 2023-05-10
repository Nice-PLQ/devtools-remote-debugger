const notFound = async (ctx, next) => {
  try {
    await next();
    const status = ctx.status || 404;
    if (status === 404) {
      ctx.type = 'html';
      ctx.body = 'Not Found';
    }
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.type = 'html';
    ctx.body = 'error';
  }
};

module.exports = notFound;
