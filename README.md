# Thiệp cưới 3D

Thiệp cưới online kể chuyện bằng 3D khi cuộn trang (lấy cảm hứng từ Noomo Valentime).
Công nghệ: Vite + Three.js + GSAP, build ra site tĩnh.

## Chạy thử

```bash
npm install
npm run dev
```

## Thay nội dung

Mọi nội dung nằm trong `src/config.js`: tên, cha mẹ, ngày cưới, câu chuyện, sự kiện, album, tài khoản mừng cưới, nhạc nền.

| Thứ cần thay | Đặt file vào | Gợi ý |
|---|---|---|
| Ảnh câu chuyện (khung ảnh 3D) | `public/photos/` | Ảnh dọc tỉ lệ 4:5, khoảng 1000×1250 px, JPG/WebP dưới 300 KB |
| Ảnh cưới chính (sau đôi nhẫn) | `public/photos/` | Như trên |
| Album | `public/photos/` | Dọc hay ngang đều được, rộng khoảng 1200 px |
| QR mừng cưới | `public/qr/` | Ảnh QR tải từ app ngân hàng |
| Nhạc nền | `public/music/song.m4a` (hoặc .mp3) | Không có file thì nút nhạc tự ẩn |

Sau khi đổi tên file, cập nhật đường dẫn tương ứng trong `src/config.js`.

## Link mời riêng từng khách

Thêm `?to=Tên khách` vào cuối link, ví dụ `https://thiep.cua-ban.com/?to=Anh%20Tuấn`.

Tạo hàng loạt: ghi mỗi tên một dòng vào `tools/guests.txt`, rồi chạy

```bash
npm run links -- https://thiep.cua-ban.com
```

Kết quả nằm ở `tools/links.csv` (mở bằng Excel hoặc Google Sheets).

## Đưa lên mạng

```bash
npm run build
```

Thư mục `dist/` là site hoàn chỉnh, có thể kéo thả lên Netlify Drop, hoặc deploy bằng Vercel hay Cloudflare Pages.
Nhớ đổi `og:image` trong `index.html` sang ảnh JPG thật để link hiện ảnh xem trước đẹp khi gửi qua Zalo hoặc Messenger.
