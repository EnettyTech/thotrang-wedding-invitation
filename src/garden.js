// Cành hoa đung đưa ở hai góc dưới và bướm bay lượn, vẽ bằng SVG.

const PALETTES = [
  ['#fde3e8', '#ee9db0'],
  ['#fff0e6', '#f3b49c'],
  ['#f8e6f2', '#d9a2c8'],
  ['#fff6f0', '#f2c4b5'],
];
const BUTTERFLY_COLORS = [
  ['#f7b8c6', '#d9607f'],
  ['#fbcfb5', '#e0845a'],
  ['#dcc4ee', '#9a6fc0'],
  ['#fde4b0', '#d9a441'],
];

let uid = 0;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createGarden(container, { butterflies = 3 } = {}) {
  const garden = document.createElement('div');
  garden.className = 'garden';
  garden.setAttribute('aria-hidden', 'true');
  garden.innerHTML = branchSvg('left') + branchSvg('right');
  container.prepend(garden);
  if (!reduceMotion) startButterflies(garden, butterflies);
}

// ---------- Cành hoa ----------

// Gốc cành ở góc dưới trái; cành bên phải là bản lật ngang.
const BASE = [24, 400];
const STEMS = [
  { tip: [120, 80], ctrl: [18, 220], r: 34, p: 0 },
  { tip: [206, 160], ctrl: [92, 256], r: 28, p: 1 },
  { tip: [52, 130], ctrl: [4, 276], r: 22, p: 2 },
  { tip: [244, 272], ctrl: [134, 330], r: 24, p: 3 },
  { tip: [168, 226], ctrl: [64, 296], r: 18, p: 2 },
  { tip: [90, 196], ctrl: [30, 300], r: 0, p: 0 },
  { tip: [212, 330], ctrl: [110, 370], r: 0, p: 0 },
];

function branchSvg(side) {
  const id = ++uid;
  const defs = PALETTES.map(
    ([a, b], i) => `<radialGradient id="pg${id}-${i}" cx="50%" cy="85%" r="90%">
      <stop offset="0" stop-color="${b}"/><stop offset="0.55" stop-color="${a}"/><stop offset="1" stop-color="${a}"/></radialGradient>`,
  ).join('');
  const stems = STEMS.map((s, i) => stemSvg(s, i, id)).join('');
  return `<svg class="branch ${side}" viewBox="0 0 280 400" preserveAspectRatio="xMinYMax meet">
    <defs>${defs}</defs>${stems}</svg>`;
}

function stemSvg({ tip, ctrl, r, p }, i, id) {
  const [bx, by] = BASE;
  const at = (t) => [
    (1 - t) ** 2 * bx + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0],
    (1 - t) ** 2 * by + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1],
  ];
  const angle = (t) => {
    const dx = 2 * (1 - t) * (ctrl[0] - bx) + 2 * t * (tip[0] - ctrl[0]);
    const dy = 2 * (1 - t) * (ctrl[1] - by) + 2 * t * (tip[1] - ctrl[1]);
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const leaves = [0.3, 0.52, 0.72]
    .map((t, k) => {
      const [x, y] = at(t);
      const side = (k + i) % 2 ? 1 : -1;
      const a = angle(t) + side * 42;
      return `<g transform="translate(${x} ${y}) rotate(${a})">
        <path d="M0 0 Q9 -8 22 0 Q9 8 0 0Z" fill="${k % 2 ? '#a7c09a' : '#8fae85'}"/>
        <path d="M1 0 L20 0" stroke="#7a9970" stroke-width="0.7"/></g>`;
    })
    .join('');

  const [tx, ty] = tip;
  const head = r
    ? flowerSvg(tx, ty, r, `pg${id}-${p}`)
    : `<g transform="translate(${tx} ${ty}) rotate(${angle(1) + 90})">
        <ellipse cx="0" cy="-7" rx="5.5" ry="9" fill="#f2a9b9"/>
        <path d="M-5 0 Q0 -6 5 0 Q0 3 -5 0Z" fill="#8fae85"/></g>`;

  const dur = (4.5 + ((i * 1.37) % 2.5)).toFixed(2);
  const delay = (-i * 0.9).toFixed(2);
  return `<g class="stem" style="transform-origin:${bx}px ${by}px;animation-duration:${dur}s;animation-delay:${delay}s">
    <path d="M${bx} ${by} Q${ctrl[0]} ${ctrl[1]} ${tx} ${ty}" fill="none" stroke="#86a17b" stroke-width="3" stroke-linecap="round"/>
    ${leaves}${head}</g>`;
}

function flowerSvg(x, y, r, grad) {
  const petal = (k, scale, off) =>
    `<ellipse cx="${x}" cy="${y - r * 0.52 * scale}" rx="${r * 0.44 * scale}" ry="${r * 0.6 * scale}" fill="url(#${grad})" stroke="#fff" stroke-opacity="0.5" stroke-width="0.6" transform="rotate(${k * 72 + off} ${x} ${y})"/>`;
  const petals =
    Array.from({ length: 5 }, (_, k) => petal(k, 1, 36)).join('') +
    Array.from({ length: 5 }, (_, k) => petal(k, 0.72, 0)).join('');
  const dots = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * Math.PI * 2;
    return `<circle cx="${x + Math.cos(a) * r * 0.2}" cy="${y + Math.sin(a) * r * 0.2}" r="${r * 0.045}" fill="#c98f4a"/>`;
  }).join('');
  return `<g class="bloom" style="transform-origin:${x}px ${y}px">${petals}
    <circle cx="${x}" cy="${y}" r="${r * 0.2}" fill="#f4d48c"/>${dots}</g>`;
}

// ---------- Bướm ----------

function butterflySvg([light, deep], id) {
  const wing = `
    <path d="M30 24 C24 6 6 0 3 10 C1 18 14 24 30 25Z" fill="url(#bw${id})"/>
    <path d="M30 26 C20 28 8 36 12 44 C16 50 26 40 30 28Z" fill="url(#bw${id})" opacity="0.92"/>
    <circle cx="12" cy="11" r="2.2" fill="#fff" fill-opacity="0.55"/>`;
  return `<svg viewBox="0 0 60 52">
    <defs><linearGradient id="bw${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${deep}"/><stop offset="1" stop-color="${light}"/></linearGradient></defs>
    <g class="wing-l">${wing}</g>
    <g class="wing-r"><g transform="translate(60 0) scale(-1 1)">${wing}</g></g>
    <ellipse cx="30" cy="27" rx="1.7" ry="9" fill="#6b4a52"/>
    <path d="M30 18 Q27 10 24 8 M30 18 Q33 10 36 8" stroke="#6b4a52" stroke-width="0.8" fill="none"/>
  </svg>`;
}

function startButterflies(garden, count) {
  const flies = Array.from({ length: count }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'butterfly';
    el.innerHTML = butterflySvg(BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length], ++uid);
    garden.append(el);
    return {
      el,
      wl: el.querySelector('.wing-l'),
      wr: el.querySelector('.wing-r'),
      x: Math.random(),
      y: 0.3 + Math.random() * 0.5,
      heading: Math.random() * Math.PI * 2,
      speed: 45 + Math.random() * 30,
      size: 0.75 + Math.random() * 0.4,
      phase: Math.random() * 10,
      target: null,
    };
  });

  let w = 0;
  let h = 0;
  const measure = () => {
    w = garden.clientWidth;
    h = garden.clientHeight;
  };
  measure();
  window.addEventListener('resize', measure);
  flies.forEach((f) => {
    f.x *= w;
    f.y *= h;
  });

  // Chỉ chạy khi vùng chứa đang hiển thị trên màn hình.
  let last = performance.now();
  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) last = performance.now();
  }).observe(garden);

  const newTarget = () => [w * (0.08 + Math.random() * 0.84), h * (0.12 + Math.random() * 0.7)];

  function frame(now) {
    if (!garden.isConnected) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    for (const f of flies) {
      if (!f.target || Math.hypot(f.target[0] - f.x, f.target[1] - f.y) < 40) f.target = newTarget();
      const want = Math.atan2(f.target[1] - f.y, f.target[0] - f.x);
      let diff = want - f.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      f.heading += Math.sign(diff) * Math.min(Math.abs(diff), 1.8 * dt) + Math.sin(now / 400 + f.phase) * 0.6 * dt;
      f.x += Math.cos(f.heading) * f.speed * dt;
      f.y += Math.sin(f.heading) * f.speed * dt;

      const t = now / 1000 + f.phase;
      const bob = Math.sin(t * 5) * 4;
      const flap = 0.22 + 0.78 * Math.abs(Math.cos(t * 11));
      const rot = (f.heading * 180) / Math.PI + 90;
      f.el.style.transform = `translate(${f.x}px, ${f.y + bob}px) rotate(${rot}deg) scale(${f.size})`;
      const wingT = `translate(30 0) scale(${flap} 1) translate(-30 0)`;
      f.wl.setAttribute('transform', wingT);
      f.wr.setAttribute('transform', wingT);
    }
  }
  requestAnimationFrame(frame);
}
