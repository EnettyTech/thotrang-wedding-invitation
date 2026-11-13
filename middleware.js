// Vercel Routing Middleware: chạy trên Vercel trước khi trả trang chủ.
// Zalo, Facebook, Messenger đọc thẻ og:* ngay trong HTML và không chạy JavaScript, nên muốn phần mô tả
// khi chia sẻ link có tên khách thì phải sửa HTML từ phía server như ở đây.
// Link mới chỉ có mã ngắn (?i=Ab3dE9) nên tên khách được đọc từ Firestore qua REST API.

export const config = { matcher: '/' };

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'tho-trang-wedding';

export default async function middleware(request) {
  const url = new URL(request.url);
  const res = await fetch(new URL('/index.html', url.origin));
  // Không lấy được trang gốc thì để Vercel trả trang như bình thường.
  if (!res.ok) return;
  const id = url.searchParams.get('i');
  const guest = /^[A-Za-z0-9]{4,12}$/.test(id || '')
    ? await fetchInviteName(id)
    : url.searchParams.get('to') || url.searchParams.get('ref');
  const html = rewriteInviteMeta(await res.text(), { origin: url.origin, href: url.href, guest });
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

// Đọc tên khách của lời mời. Lỗi hay chậm quá 2,5 giây thì bỏ qua, dùng mô tả mặc định.
async function fetchInviteName(id) {
  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/invites/${id}`;
    const headers = {};
    let target = endpoint;
    // Có service account thì đọc bằng quyền quản trị (vẫn chạy khi App Check đã Enforce);
    // không có thì dùng API key như trình duyệt (chỉ chạy khi App Check chưa Enforce).
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) headers.authorization = `Bearer ${await serviceToken(JSON.parse(sa))}`;
    else target += `?key=${process.env.VITE_FIREBASE_API_KEY || ''}`;
    const res = await fetch(target, { headers, signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const doc = await res.json();
    return doc.fields?.name?.stringValue ?? null;
  } catch {
    return null;
  }
}

// Đổi service account lấy access token Google (JWT ký RS256 bằng WebCrypto), giữ lại tới gần lúc hết hạn.
let cachedToken = null;
async function serviceToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;
  const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const part = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const der = Uint8Array.from(atob(sa.private_key.replace(/-----[^-]+-----|\s/g, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('Không lấy được access token');
  cachedToken = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return cachedToken.token;
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
