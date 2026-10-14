export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/make' || url.pathname.startsWith('/make/')) {
    const expectedUser = env.MAKE_USER || 'admin';
    const expectedPass = env.MAKE_PASS;

    if (!expectedPass) {
      return new Response('Server misconfigured', { status: 500 });
    }

    const auth = request.headers.get('Authorization');
    if (!auth || !auth.startsWith('Basic ')) {
      return new Response('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Admin", charset="UTF-8"' },
      });
    }

    let decoded;
    try { decoded = atob(auth.slice(6)); } catch { return new Response('Bad credentials', { status: 401 }); }

    const idx = decoded.indexOf(':');
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);

    if (user !== expectedUser || pass !== expectedPass) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return next();
}
