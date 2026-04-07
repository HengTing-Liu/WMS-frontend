const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  const loginResp = await fetch('http://localhost:8080/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const token = loginResp.data.access_token;

  const menuResp = await fetch('http://localhost:8080/api/menu/getRouters', {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  console.log('\n=== Top-level menus ===');
  menuResp.data.forEach(m => {
    const title = m.meta && m.meta.title ? m.meta.title : 'NO_TITLE';
    console.log((m.hidden ? '[HIDDEN]' : '[VISIBLE]'), 'name:', m.name, 'title:', title, 'component:', m.component || 'NULL');
  });

  // Also check: what role_menus does admin have for top-level menus?
  console.log('\n=== Total menus returned:', menuResp.data.length, '===');
}
main().catch(console.error);
