// Vercel Routing Middleware: chạy trên Vercel trước khi trả trang chủ.
// Zalo, Facebook, Messenger đọc thẻ og:* ngay trong HTML và không chạy JavaScript, nên muốn phần mô tả
// khi chia sẻ link có tên khách (?to=...) thì phải sửa HTML từ phía server như ở đây.

export const config = { matcher: '/' };

export default async function middleware(request) {
  const url = new URL(request.url);
  const res = await fetch(new URL('/index.html', url.origin));
  // Không lấy được trang gốc thì để Vercel trả trang như bình thường.
  if (!res.ok) return;
  const html = rewriteInviteMeta(await res.text(), {
    origin: url.origin,
    href: url.href,
    guest: url.searchParams.get('to') || url.searchParams.get('ref'),
  });
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300',
    },
  });
}

export function rewriteInviteMeta(html, { origin, href, guest }) {
  // Ảnh và link chia sẻ phải là đường dẫn đầy đủ thì Zalo/Facebook mới nhận.
  for (const key of ['og:image', 'twitter:image']) {
    const value = getMeta(html, key);
    if (value?.startsWith('/')) html = setMeta(html, key, origin + value);
  }
  html = setMeta(html, 'og:url', href);

  const name = cleanName(guest);
  const template = getMeta(html, 'invite-description');
  if (name && template) {
    const text = decode(template).replaceAll('{ten}', () => name);
    for (const key of ['description', 'og:description', 'twitter:description']) html = setMeta(html, key, text);
  }
  return html;
}

function cleanName(raw) {
  const name = (raw || '').trim().replace(/\s+/g, ' ');
  return [...name].slice(0, 80).join('');
}

const metaRe = (key) => new RegExp(`(<meta\\s+(?:name|property)="${key.replace(/[:.]/g, '\\$&')}"\\s+content=")([^"]*)(")`);

function getMeta(html, key) {
  return html.match(metaRe(key))?.[2] ?? null;
}

// Đổi giá trị nếu thẻ đã có; chưa có thì thêm vào trước </head>.
function setMeta(html, key, value) {
  const re = metaRe(key);
  if (re.test(html)) return html.replace(re, (_, a, _old, b) => a + encode(value) + b);
  const attr = key.startsWith('og:') ? 'property' : 'name';
  return html.replace('</head>', () => `  <meta ${attr}="${key}" content="${encode(value)}" />\n  </head>`);
}

function encode(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
