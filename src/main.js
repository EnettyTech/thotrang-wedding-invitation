import * as THREE from 'three';
import { gsap } from 'gsap';
import { config } from './config.js';
import { createScene, hasWebGL } from './scene.js';
import { renderSeal, openSeal } from './seal.js';
import { createGarden } from './garden.js';
import { setupWishes } from './wishes.js';
import { stableHeight, onViewportChange } from './viewport.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// ---------- Tên khách từ link: ?to=Anh%20Tu%E1%BA%A5n (hoặc ?ref=...) ----------
const params = new URLSearchParams(location.search);
const guest = clampName((params.get('to') || params.get('ref') || '').trim().replace(/\s+/g, ' ')) || config.defaultGuest;

// Giới hạn 80 ký tự; nếu dài hơn thì cắt ở khoảng trắng gần nhất thay vì cắt giữa chữ.
function clampName(name, max = 80) {
  const chars = [...name];
  if (chars.length <= max) return name;
  const cut = chars.slice(0, max).join('');
  return cut.slice(0, cut.lastIndexOf(' ') > max / 2 ? cut.lastIndexOf(' ') : undefined) + '…';
}

// ---------- Đổ nội dung từ config ----------
function bindText() {
  document.querySelectorAll('[data-bind]').forEach((n) => {
    const value = n.dataset.bind.split('.').reduce((o, k) => o?.[k], config);
    n.textContent = value || '';
    if (!value && n.classList.contains('lunar')) n.remove();
  });
  document.title = `Thiệp cưới ${config.groom.name} & ${config.bride.name}`;
  $('#monogram').textContent = config.monogram;
  $('#intro-guest').textContent = guest;
  $('#hero-guest').textContent = guest;
  // Tên dài thì thu nhỏ chữ để bìa thiệp không bị đẩy quá cao.
  const len = [...guest].length;
  const size = len > 28 ? 'xlong' : len > 16 ? 'long' : '';
  if (size) document.querySelectorAll('.guest').forEach((g) => g.classList.add(size));
  $('#groom-parents').innerHTML = config.groom.parents.map(escapeHtml).join('<br>');
  $('#bride-parents').innerHTML = config.bride.parents.map(escapeHtml).join('<br>');
  $('#union-photo').src = config.coverPhoto;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function renderChapters() {
  const root = $('#chapters');
  config.story.forEach((ch, i) => {
    const sec = el('section', `chapter ${i % 2 === 0 ? 'left' : 'right'}`);
    sec.dataset.stage = '';
    const sticky = el('div', 'sticky');
    const card = el('article', 'chapter-card ornate reveal');
    card.append(
      el('p', 'chapter-year', ch.year),
      el('h2', 'chapter-title', ch.title),
      el('p', 'chapter-text', ch.text),
    );
    const img = el('img', 'fallback-photo chapter-photo');
    img.src = ch.photo;
    img.alt = ch.title;
    img.loading = 'lazy';
    sticky.append(img, card);
    sec.append(sticky);
    root.append(sec);
  });
}

function renderEvents() {
  const root = $('#events');
  config.events.forEach((ev) => {
    const card = el('article', `event ornate reveal${ev.main ? ' main' : ''}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`;
    card.append(
      el('h3', 'event-title', ev.title),
      el('p', 'event-time', ev.time),
      el('p', 'event-date', ev.date),
      el('p', 'event-place', ev.place),
      el('p', 'event-address', ev.address),
    );
    const actions = el('div', 'event-actions');
    const dir = el('a', 'btn ghost small', 'Chỉ đường');
    dir.href = mapsUrl;
    dir.target = '_blank';
    dir.rel = 'noopener';
    actions.append(dir);
    if (ev.main) {
      const cal = el('a', 'btn ghost small', 'Thêm vào lịch');
      cal.href = calendarUrl(ev);
      cal.target = '_blank';
      cal.rel = 'noopener';
      actions.append(cal);

      const frame = document.createElement('iframe');
      frame.title = `Bản đồ ${ev.place}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(ev.mapQuery || ev.address)}&z=15&output=embed`;
      $('#map-wrap').append(frame);
    }
    card.append(actions);
    root.append(card);
  });
}

// Bữa cơm thân mật từ link mời: ?gio=17:30&ngay=2026-12-11. Thiếu hoặc sai định dạng thì không hiện.
const meal = parseMeal(params.get('gio'), params.get('ngay'), params.get('noi'));

function parseMeal(gio, ngay, noi) {
  const t = /^(\d{1,2})[:h](\d{2})/.exec((gio || '').trim());
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ngay || '').trim());
  if (!t || !d || +t[1] > 23 || +t[2] > 59) return null;
  const time = `${t[1].padStart(2, '0')}:${t[2]}`;
  const start = new Date(`${d[1]}-${d[2]}-${d[3]}T${time}:00+07:00`);
  if (Number.isNaN(start.getTime())) return null;
  return { time, date: `${d[3]}/${d[2]}/${d[1]}`, start, venue: noi === 'gai' ? 'gai' : 'trai' };
}

// "12/12/2026" + "10:10" hoặc "9h10" → Date giờ Việt Nam.
function eventStart(ev) {
  if (ev.start) return ev.start;
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(ev.date || '');
  const t = /^(\d{1,2})[:h](\d{2})/.exec(ev.time || '');
  if (!d || !t) return new Date(config.date);
  const pad = (n) => String(n).padStart(2, '0');
  return new Date(`${d[3]}-${pad(d[2])}-${pad(d[1])}T${pad(t[1])}:${t[2]}:00+07:00`);
}

function renderMeal() {
  if (!meal || !config.meal) return;
  const ev = { title: config.meal.title, ...config.meal.venues[meal.venue], ...meal };
  const card = el('article', 'meal reveal');
  const invite = el('p', 'meal-invite');
  invite.append('Trân trọng kính mời ', el('strong', null, guest), ' ở lại dùng');
  card.append(
    invite,
    el('h3', 'meal-title', ev.title),
    el('p', 'meal-time', ev.time),
    el('p', 'meal-date', ev.date),
    el('p', 'event-place', ev.place),
    el('p', 'event-address', ev.address),
  );
  const actions = el('div', 'event-actions');
  const dir = el('a', 'btn ghost small', 'Chỉ đường');
  dir.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`;
  dir.target = '_blank';
  dir.rel = 'noopener';
  const cal = el('a', 'btn ghost small', 'Thêm vào lịch');
  cal.href = calendarUrl(ev, `${ev.title} – Đám cưới ${config.groom.name} & ${config.bride.name}`);
  cal.target = '_blank';
  cal.rel = 'noopener';
  actions.append(dir, cal);
  card.append(actions);
  $('#meal').append(card);
}

function calendarUrl(ev, title = `Đám cưới ${config.groom.name} & ${config.bride.name}`) {
  const start = eventStart(ev);
  const end = new Date(start.getTime() + 3 * 3600 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: `${ev.place}, ${ev.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function renderGallery() {
  const root = $('#gallery');
  config.gallery.forEach((src, i) => {
    const btn = el('button', 'gallery-item reveal');
    btn.setAttribute('aria-label', `Xem ảnh ${i + 1}`);
    btn.style.transitionDelay = `${(i % 3) * 0.12}s`;
    // Khung hoa văn nằm trong phần tử riêng để độ nghiêng không bị hiệu ứng hiện dần ghi đè.
    const frame = el('figure', 'frame ornate');
    const img = el('img');
    img.src = src;
    img.alt = `Ảnh cưới ${i + 1}`;
    img.loading = 'lazy';
    const caption = el('figcaption', 'frame-caption', `No. ${String(i + 1).padStart(2, '0')}`);
    frame.append(img, caption);
    btn.append(frame);
    btn.addEventListener('click', () => openLightbox(i));
    root.append(btn);
  });
}

// ---------- Lightbox ----------
let lbIndex = 0;
function openLightbox(i) {
  lbIndex = i;
  const lb = $('#lightbox');
  $('img', lb).src = config.gallery[i];
  lb.hidden = false;
  document.body.classList.add('lb-open');
  $('.lb-close', lb).focus();
}
function closeLightbox() {
  $('#lightbox').hidden = true;
  document.body.classList.remove('lb-open');
}
function stepLightbox(d) {
  openLightbox((lbIndex + d + config.gallery.length) % config.gallery.length);
}
function setupLightbox() {
  const lb = $('#lightbox');
  $('.lb-close', lb).addEventListener('click', closeLightbox);
  $('.lb-prev', lb).addEventListener('click', () => stepLightbox(-1));
  $('.lb-next', lb).addEventListener('click', () => stepLightbox(1));
  lb.addEventListener('click', (e) => e.target === lb && closeLightbox());
  window.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
  let x0 = null;
  lb.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
    x0 = null;
  });
}

// ---------- Tiện ích ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function startCountdown() {
  const target = new Date(config.date).getTime();
  const units = [...document.querySelectorAll('.flip')].map(createFlip);
  const byKey = Object.fromEntries(units.map((u) => [u.key, u]));
  const update = () => {
    let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    byKey.d.set(String(Math.floor(s / 86400)).padStart(2, '0'));
    s %= 86400;
    byKey.h.set(String(Math.floor(s / 3600)).padStart(2, '0'));
    s %= 3600;
    byKey.m.set(String(Math.floor(s / 60)).padStart(2, '0'));
    byKey.s.set(String(s % 60).padStart(2, '0'));
  };
  update();
  setInterval(update, 1000);
}

// Một thẻ lật: nửa trên hiện ngay số mới, nửa trên cũ lật xuống, rồi nửa dưới mới lật vào.
function createFlip(root) {
  const half = (pos, value, extra = '') => {
    const n = el('span', `flip-half ${pos} ${extra}`.trim());
    n.append(el('span', null, value));
    return n;
  };
  const card = el('div', 'flip-card');
  const top = half('top', '');
  const bottom = half('bottom', '');
  card.append(top, bottom);
  root.append(card, el('span', 'flip-label', root.dataset.label));

  let current = null;
  let active = null;
  // Dọn lượt lật trước (nếu còn dở) để các lớp không chồng lên nhau.
  const settle = () => {
    if (!active) return;
    active.forEach((n) => n.remove());
    active = null;
    bottom.firstChild.textContent = current;
  };
  return {
    key: root.dataset.cd,
    set(value) {
      if (value === current) return;
      settle();
      const old = current;
      current = value;
      top.firstChild.textContent = value;
      if (old === null || document.hidden) {
        bottom.firstChild.textContent = value;
        return;
      }
      active = [half('top', old, 'flipping'), half('bottom', value, 'flipping')];
      card.append(...active);
      active[1].addEventListener('animationend', settle, { once: true });
    },
  };
}

function setupReveal() {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
    { threshold: 0.2 },
  );
  document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
}

// ---------- Nhạc ----------
// Nhạc mặc định bật. Trình duyệt chặn phát tiếng trước khi khách chạm vào trang,
// nên nếu bị chặn thì phát ngay ở lần chạm/bấm phím đầu tiên (thường là lúc bấm con dấu).
const audio = new Audio();
let wantMusic = true;
const GESTURES = ['pointerdown', 'touchend', 'keydown'];
function setupMusic() {
  if (!config.music) return;
  audio.src = config.music;
  audio.loop = true;
  audio.volume = 0.6;
  audio.preload = 'auto';
  audio.addEventListener('canplay', () => ($('#sound-btn').hidden = false), { once: true });
  audio.addEventListener('play', () => $('#sound-btn').setAttribute('aria-pressed', 'true'));
  audio.addEventListener('pause', () => $('#sound-btn').setAttribute('aria-pressed', 'false'));
  $('#sound-btn').addEventListener('click', () => {
    wantMusic = audio.paused;
    wantMusic ? playMusic() : audio.pause();
  });
  GESTURES.forEach((ev) => window.addEventListener(ev, unlockMusic, { capture: true }));
  playMusic();
}
function unlockMusic() {
  if (wantMusic && audio.paused) playMusic();
  if (!audio.paused) GESTURES.forEach((ev) => window.removeEventListener(ev, unlockMusic, { capture: true }));
}
function playMusic() {
  if (!config.music || !wantMusic) return;
  audio.play().catch(() => {});
}

// ---------- Cảnh 3D + cuộn ----------
function setupScene(manager) {
  if (!hasWebGL()) {
    document.body.classList.add('no-webgl');
    return null;
  }
  document.body.classList.add('webgl');
  const scene = createScene({
    canvas: $('#scene'),
    storyPhotos: config.story.map((c) => c.photo),
    coverPhoto: config.coverPhoto,
    manager,
  });

  const sections = [...document.querySelectorAll('[data-stage]')];
  const journey = $('#journey');
  const onScroll = () => {
    const mid = stableHeight() / 2;
    let stage = 0;
    for (let i = 0; i < sections.length; i++) {
      const r = sections[i].getBoundingClientRect();
      if (mid >= r.top) stage = i + Math.min(1, (mid - r.top) / r.height);
    }
    scene.setStage(stage);
    scene.setRunning(journey.getBoundingClientRect().bottom > 0);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onViewportChange(onScroll);
  onScroll();
  return scene;
}

// ---------- Khởi động ----------
const pct = $('#loader-pct');

function boot() {
  bindText();
  renderChapters();
  renderEvents();
  renderMeal();
  renderGallery();
  setupWishes({ config, guest, toast });
  setupLightbox();
  setupMusic();
  startCountdown();
  const topbar = $('.topbar');
  const onScrollBar = () => topbar.classList.toggle('solid', $('#journey').getBoundingClientRect().bottom < 80);
  window.addEventListener('scroll', onScrollBar, { passive: true });

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => {
    pct.textContent = `${Math.round((loaded / total) * 100)}%`;
  };
  const assetsReady = new Promise((resolve) => {
    manager.onLoad = resolve;
    manager.onError = () => {};
  });
  const scene = setupScene(manager);

  const minDelay = new Promise((r) => setTimeout(r, 1200));
  const safety = new Promise((r) => setTimeout(r, 8000));
  Promise.race([Promise.all([scene ? assetsReady : null, document.fonts.ready, minDelay]), safety]).then(showIntro);
}

function showIntro() {
  pct.textContent = '100%';
  const intro = $('#intro');
  intro.hidden = false;
  gsap.to('#loader', { autoAlpha: 0, duration: 0.6, onComplete: () => $('#loader').remove() });
  gsap.from('.intro-card > *', { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out', delay: 0.2 });

  renderSeal($('#open-btn'), config.monogram);
  createGarden(intro, { butterflies: 3 });
  createGarden($('.hero'), { butterflies: 4 });

  $('#open-btn').addEventListener('click', async () => {
    playMusic();
    await openSeal($('#open-btn'));
    gsap.to(intro, {
      autoAlpha: 0,
      scale: 1.04,
      duration: 0.9,
      ease: 'power2.inOut',
      onComplete: () => {
        intro.remove();
        document.body.classList.remove('locked');
        setupReveal();
      },
    });
  }, { once: true });
}
boot();
