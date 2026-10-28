// Tạo link mời riêng cho từng khách.
// Dùng: npm run links -- https://ten-mien-cua-ban.com
// Đọc danh sách tên từ tools/guests.txt (mỗi dòng một tên), xuất ra tools/links.csv
import { readFileSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://localhost:5173').replace(/\/$/, '');
const names = readFileSync(new URL('./guests.txt', import.meta.url), 'utf8')
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const rows = names.map((n) => `"${n.replace(/"/g, '""')}",${base}/?to=${encodeURIComponent(n)}`);
writeFileSync(new URL('./links.csv', import.meta.url), '﻿Tên khách,Link\n' + rows.join('\n') + '\n');
console.log(`Đã tạo ${rows.length} link → tools/links.csv`);
