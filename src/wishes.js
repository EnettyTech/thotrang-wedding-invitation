import { createWishesStore, fakeStore, LIMITS } from './wishes-store.js';

const $ = (sel, root = document) => root.querySelector(sel);
const NAME_KEY = 'wedding-wish-name';
const HEART_SVG = `<svg viewBox="0 0 32 29"><defs><linearGradient id="wish-heart-g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#f19aae"/><stop offset="1" stop-color="#c4506a"/></linearGradient></defs>
  <path d="M16 28S1 19.2 1 9.3A7.8 7.8 0 0 1 16 5.6a7.8 7.8 0 0 1 15 3.7C31 19.2 16 28 16 28Z" fill="url(#wish-heart-g)"/>
  <path d="M8.5 6.5a4 4 0 0 0-3.6 3" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>`;
const COOLDOWN_MS = 20000;

/** Nút "Gửi lời chúc", modal nhập lời chúc và danh sách lời chúc cập nhật realtime. */
export function setupWishes({ config, guest, toast }) {
  const modal = $('#wish-modal');
  const form = $('#wish-form');
  const nameInput = form.elements.name;
  const msgInput = form.elements.message;
  const counter = $('.counter', form);
  const errorBox = $('.form-error', form);
  const submit = $('button[type=submit]', form);
  const openBtn = $('#wish-open');
  const list = $('#wish-list');
  const count = $('#wish-count');

  $('#wish-to').textContent = `đến ${config.groom.name} & ${config.bride.name}`;
  nameInput.maxLength = LIMITS.name;
  msgInput.maxLength = LIMITS.message;

  // ---------- Modal ----------
  const open = () => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    // Ưu tiên tên khách trong link mời, sau đó tới tên khách đã gõ ở lần gửi trước.
    const linkName = guest !== config.defaultGuest ? guest : '';
    if (!nameInput.value) nameInput.value = linkName || safeGet(NAME_KEY) || '';
    errorBox.textContent = '';
    updateCounter();
    requestAnimationFrame(() => (nameInput.value ? msgInput : nameInput).focus());
  };
  const close = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    openBtn.focus();
  };
  const updateCounter = () => (counter.textContent = `${msgInput.value.length}/${LIMITS.message}`);

  openBtn.addEventListener('click', open);
  $('.modal-close', modal).addEventListener('click', close);
  modal.addEventListener('click', (e) => e.target === modal && close());
  window.addEventListener('keydown', (e) => !modal.hidden && e.key === 'Escape' && close());
  msgInput.addEventListener('input', updateCounter);

  // ---------- Danh sách ----------
  let store = null;
  let wishes = [];
  const seen = new Set();
  let firstRender = true;

  const render = () => {
    count.textContent = wishes.length ? `${wishes.length} lời chúc` : '';
    if (!wishes.length) {
      list.replaceChildren(empty('Hãy là người đầu tiên gửi lời chúc nhé!'));
      return;
    }
    list.replaceChildren(
      ...wishes.map((w) => {
        const card = document.createElement('article');
        card.className = 'wish';
        if (!firstRender && !seen.has(w.id)) card.classList.add('new');
        seen.add(w.id);
        // Lá thư nhỏ: trái tim gắn trên đầu, lời chúc ở giữa, chữ ký người gửi ở cuối.
        const heart = document.createElement('span');
        heart.className = 'wish-heart';
        heart.setAttribute('aria-hidden', 'true');
        heart.innerHTML = HEART_SVG;
        const msg = document.createElement('p');
        msg.className = 'wish-message';
        msg.textContent = w.message;
        const foot = document.createElement('footer');
        const name = document.createElement('h3');
        name.className = 'wish-name';
        name.textContent = w.name;
        const time = document.createElement('time');
        time.className = 'wish-time';
        time.dateTime = new Date(w.createdAt).toISOString();
        time.textContent = timeAgo(w.createdAt);
        foot.append(name, time);
        card.append(heart, msg, foot);
        return card;
      }),
    );
    firstRender = false;
  };
  setInterval(() => wishes.length && render(), 60000);

  list.replaceChildren(empty('Đang tải lời chúc…'));
  // ?fake=100 khi chạy dev: xem thử với lời chúc giả trong bộ nhớ, không đụng tới Firebase.
  const fake = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get('fake')) : 0;
  (fake > 0 ? Promise.resolve(fakeStore(Math.min(fake, 500))) : createWishesStore(config.firebase))
    .then((s) => {
      store = s;
      store.subscribe(
        (items) => {
          wishes = items;
          render();
        },
        (err) => {
          console.error('[Lời chúc]', err);
          list.replaceChildren(empty('Chưa tải được lời chúc. Bạn thử tải lại trang nhé.'));
        },
      );
    })
    .catch((err) => {
      console.error('[Lời chúc]', err);
      list.replaceChildren(empty('Chưa tải được lời chúc. Bạn thử tải lại trang nhé.'));
    });

  // ---------- Gửi ----------
  let lastSent = 0;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, ' ');
    const message = msgInput.value.trim();
    if (!name) return showError('Bạn nhập tên giúp mình nhé.', nameInput);
    if (!message) return showError('Bạn chưa viết lời chúc.', msgInput);
    if (Date.now() - lastSent < COOLDOWN_MS) return showError('Bạn vừa gửi lời chúc, đợi chút rồi gửi tiếp nhé.');
    if (!store) return showError('Đang kết nối, bạn thử lại sau giây lát.');

    submit.disabled = true;
    submit.textContent = 'Đang gửi…';
    try {
      await store.add({ name: name.slice(0, LIMITS.name), message: message.slice(0, LIMITS.message) });
      lastSent = Date.now();
      safeSet(NAME_KEY, name);
      msgInput.value = '';
      close();
      toast('Cảm ơn bạn đã gửi lời chúc ♥');
      list.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('[Lời chúc]', err);
      showError('Gửi chưa được, bạn kiểm tra mạng rồi thử lại nhé.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Gửi lời chúc';
    }
  });

  function showError(text, field) {
    errorBox.textContent = text;
    field?.focus();
  }
}

function empty(text) {
  const p = document.createElement('p');
  p.className = 'wish-empty';
  p.textContent = text;
  return p;
}

function timeAgo(ms) {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // bỏ qua nếu trình duyệt chặn lưu trữ
  }
}
