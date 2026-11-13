// Trang tạo link mời (/tao-link.html): lưu từng lời mời vào Firestore và trả về link ngắn ?i=mã.
import { config } from './config.js';
import { hasFirebase } from './firebase.js';
import { createInvite } from './invites.js';

const $ = (id) => document.getElementById(id);
const DEFAULT_TEMPLATE =
  'Thân gửi {ten}, Thọ & Trang trân trọng mời bạn đến chung vui trong ngày cưới của chúng mình. Thiệp mời: {link}';
const VENUES = { trai: 'Tư gia nhà trai', gai: 'Tư gia nhà gái' };

// Ghi nhớ lời mời trên máy này cho lần sau.
const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // bỏ qua nếu trình duyệt chặn lưu trữ
    }
  },
};
$('template').value = store.get('invite-template') || DEFAULT_TEMPLATE;

let items = [];

// Bật/tắt mời dùng bữa thì khoá hoặc mở các ô ngày, giờ, nơi tổ chức.
const syncMeal = () => ($('meal-fields').disabled = !$('meal-on').checked);
$('meal-on').addEventListener('change', syncMeal);
syncMeal();

// Link trỏ về trang chủ của chính tên miền đang mở trang này.
const linkFor = (id) => {
  const url = new URL('/', location.origin);
  url.searchParams.set('i', id);
  return url.toString();
};
const vnDate = (iso) => iso.split('-').reverse().join('/');
const messageFor = (it) =>
  $('template')
    .value.replaceAll('{ten}', () => it.name)
    .replaceAll('{link}', () => it.link)
    .replaceAll('{gio}', () => it.meal?.time ?? '')
    .replaceAll('{ngay}', () => (it.meal ? vnDate(it.meal.date) : ''))
    .replaceAll('{noi}', () => (it.meal ? VENUES[it.meal.venue] : ''));

async function make() {
  if (!hasFirebase(config.firebase)) return toast('Chưa cấu hình Firebase nên chưa lưu được lời mời');
  const names = [...new Set($('names').value.split('\n').map((s) => s.trim().replace(/\s+/g, ' ')).filter(Boolean))];
  if (!names.length) return toast('Bạn nhập ít nhất một tên khách nhé');
  let meal = null;
  if ($('meal-on').checked) {
    const date = $('meal-date').value;
    const time = $('meal-time').value.slice(0, 5);
    if (!date || !time) return toast('Bữa cơm thân mật cần cả ngày và giờ');
    meal = { date, time, venue: $('meal-venue').value };
  }
  store.set('invite-template', $('template').value);

  const btn = $('make');
  btn.disabled = true;
  const created = [];
  let failed = 0;
  // Ghi lần lượt để dễ báo tiến độ và không dồn quá nhiều yêu cầu cùng lúc.
  for (const [i, raw] of names.entries()) {
    btn.textContent = `Đang lưu ${i + 1}/${names.length}…`;
    const name = [...raw].slice(0, 80).join('');
    try {
      const id = await createInvite(config.firebase, { name, meal });
      created.push({ name, meal, id, link: linkFor(id) });
    } catch (err) {
      console.error('[Tạo link]', name, err);
      failed++;
    }
  }
  btn.disabled = false;
  btn.textContent = 'Tạo link';

  const status = $('status');
  status.hidden = !failed;
  status.textContent = failed
    ? `Có ${failed} khách chưa lưu được (kiểm tra mạng hoặc quy tắc Firestore), bấm Tạo link lần nữa cho những khách đó.`
    : '';
  if (!created.length) return toast('Chưa tạo được link nào');
  items = created;
  render();
}

function render() {
  $('output').hidden = false;
  $('summary').textContent = `${items.length} link mời`;
  $('results').replaceChildren(
    ...items.map((it) => {
      const card = document.createElement('article');
      card.className = 'result';
      const name = document.createElement('p');
      name.className = 'result-name';
      name.textContent = it.name;
      const link = document.createElement('a');
      link.className = 'result-link';
      link.href = it.link;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = it.link;
      const row = document.createElement('div');
      row.className = 'row';
      row.append(
        button('Chép link', () => copy(it.link, 'Đã chép link')),
        button('Chép lời mời', () => copy(messageFor(it), 'Đã chép lời mời')),
      );
      if (navigator.share) {
        row.append(button('Chia sẻ', () => navigator.share({ title: 'Thiệp cưới', text: messageFor(it) }).catch(() => {})));
      }
      card.append(name);
      if (it.meal) {
        const m = document.createElement('p');
        m.className = 'result-meal';
        m.textContent = `Bữa cơm thân mật: ${it.meal.time} · ${vnDate(it.meal.date)} · ${VENUES[it.meal.venue]}`;
        card.append(m);
      }
      card.append(link, row);
      return card;
    }),
  );
  $('output').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function button(text, onClick) {
  const b = document.createElement('button');
  b.className = 'ghost small';
  b.textContent = text;
  b.addEventListener('click', onClick);
  return b;
}

async function copy(text, done) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Trình duyệt chặn clipboard (http hoặc webview): chép theo cách cũ.
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(done);
}

function downloadCsv() {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [
    'Tên khách,Mã,Link,Lời mời',
    ...items.map((it) => [it.name, it.id, it.link, messageFor(it)].map(esc).join(',')),
  ];
  // BOM để Excel đọc đúng tiếng Việt.
  const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'link-moi.csv' });
  a.click();
  URL.revokeObjectURL(a.href);
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

$('make').addEventListener('click', make);
$('copy-all-links').addEventListener('click', () =>
  copy(items.map((it) => `${it.name}: ${it.link}`).join('\n'), `Đã chép ${items.length} link`),
);
$('copy-all-msgs').addEventListener('click', () =>
  copy(items.map(messageFor).join('\n\n'), `Đã chép ${items.length} lời mời`),
);
$('csv').addEventListener('click', downloadCsv);
