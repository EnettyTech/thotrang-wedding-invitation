import { gsap } from 'gsap';

// Con dấu sáp tròn vẽ bằng SVG: thân đỏ có khối, lòng ấn lõm, chữ lồng dập nổi.
export function renderSeal(button, monogram) {
  const t = monogram.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  button.innerHTML = `
    <svg class="seal-svg" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient id="seal-body" cx="38%" cy="30%" r="78%">
          <stop offset="0" stop-color="#cf4a5d" />
          <stop offset="0.55" stop-color="#a02436" />
          <stop offset="1" stop-color="#6c1321" />
        </radialGradient>
        <linearGradient id="seal-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f2a2af" stop-opacity="0.9" />
          <stop offset="0.5" stop-color="#a02436" stop-opacity="0" />
          <stop offset="1" stop-color="#4a0a15" stop-opacity="0.8" />
        </linearGradient>
        <linearGradient id="seal-well" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#7a1526" />
          <stop offset="1" stop-color="#b4374b" />
        </linearGradient>
        <linearGradient id="seal-well-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4a0a15" stop-opacity="0.75" />
          <stop offset="1" stop-color="#f4a9b5" stop-opacity="0.75" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="95" fill="url(#seal-body)" />
      <circle cx="100" cy="100" r="93.5" fill="none" stroke="url(#seal-rim)" stroke-width="3" />
      <circle cx="100" cy="100" r="72" fill="url(#seal-well)" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="url(#seal-well-edge)" stroke-width="2.5" />
      <circle cx="100" cy="100" r="63" fill="none" stroke="#f4b6c0" stroke-opacity="0.4" stroke-width="1" />
      <g font-family="'Great Vibes', cursive" font-size="50" text-anchor="middle">
        <text x="100" y="116" dy="2" fill="#3f0811" fill-opacity="0.7">${t}</text>
        <text x="100" y="116" dy="-1.2" fill="#ffd0d8" fill-opacity="0.85">${t}</text>
        <text x="100" y="116" fill="#c2485c">${t}</text>
      </g>
      <ellipse cx="70" cy="48" rx="40" ry="15" transform="rotate(-32 70 48)" fill="#fff" fill-opacity="0.13" />
    </svg>`;
}

// Nhấn con dấu xuống rồi phóng to và mờ đi.
export function openSeal(button) {
  const svg = button.querySelector('.seal-svg');
  button.classList.add('opening');
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(svg, { scale: 0.9, duration: 0.15, ease: 'power2.in' })
      .to(svg, { scale: 1.35, autoAlpha: 0, duration: 0.6, ease: 'power2.out' });
  });
}
