# Thiệp cưới 3D

Thiệp cưới online kể chuyện bằng 3D khi cuộn trang (lấy cảm hứng từ Noomo Valentime).
Công nghệ: Vite + Three.js + GSAP, build ra site tĩnh.

## Chạy thử

```bash
npm install
npm run dev
```

## Thay nội dung

Mọi nội dung nằm trong `src/config.js`: tên, cha mẹ, ngày cưới, câu chuyện, sự kiện, album, nhạc nền và cấu hình sổ lời chúc.

| Thứ cần thay | Đặt file vào | Gợi ý |
|---|---|---|
| Ảnh câu chuyện (khung ảnh 3D) | `public/photos/` | Ảnh dọc tỉ lệ 4:5, khoảng 1000×1250 px, JPG/WebP dưới 300 KB |
| Ảnh cưới chính (sau đôi nhẫn) | `public/photos/` | Như trên |
| Album | `public/photos/` | Dọc hay ngang đều được, rộng khoảng 1200 px |
| Nhạc nền | `public/music/song.m4a` (hoặc .mp3) | Không có file thì nút nhạc tự ẩn |

Sau khi đổi tên file, cập nhật đường dẫn tương ứng trong `src/config.js`.

## Sổ lời chúc (Firebase)

Khi chưa cấu hình Firebase, lời chúc chỉ lưu trên trình duyệt đang mở. Để mọi khách cùng thấy lời chúc realtime:

1. Vào https://console.firebase.google.com, tạo project mới (gói miễn phí Spark là đủ).
2. **Build → Firestore Database → Create database** (chọn vùng `asia-southeast1`, chế độ production).
3. Tab **Rules**: dán nội dung file `firestore.rules` trong repo này rồi bấm **Publish**. Quy tắc này cho phép ai cũng đọc và gửi lời chúc, nhưng không ai sửa hoặc xoá được.
4. **Project settings → Your apps → Web (</>)**: đăng ký app, ghi `authDomain` và `projectId` vào mục `firebase` trong `src/config.js`.
5. `apiKey` và `appId` đặt bằng biến môi trường (tên phải bắt đầu bằng `VITE_` thì Vite mới đọc):
   - Máy dev: chép `.env.example` thành `.env.local` rồi điền giá trị (file này không bị commit).
   - Vercel: **Settings → Environment Variables**, thêm `VITE_FIREBASE_API_KEY` và `VITE_FIREBASE_APP_ID`, rồi **Redeploy**.

Cấu hình web của Firebase không phải mật khẩu, để công khai trong code là bình thường. Quyền ghi được kiểm soát bởi `firestore.rules`.
Muốn xoá lời chúc không phù hợp: vào Firestore Database trên Firebase Console, collection `wishes`, xoá document đó.

### Chống spam bằng App Check (reCAPTCHA v3)

1. Tạo key tại https://www.google.com/recaptcha/admin/create: chọn **Score based (v3)**, domain gồm tên miền Vercel (ví dụ `thotrang.vercel.app`) và `localhost`. Bạn nhận được **site key** và **secret key**.
2. Firebase Console → **App Check** → tab **Apps** → chọn web app → **reCAPTCHA** → dán **secret key** → Save.
3. Vercel → Environment Variables: thêm `VITE_RECAPTCHA_SITE_KEY` = site key (type **Config**) → Redeploy.
4. Máy dev: thêm `VITE_RECAPTCHA_SITE_KEY` vào `.env.local`, chạy `npm run dev`, mở trang, xem Console có dòng
   `App Check debug token: ...`. Vào Firebase Console → App Check → Apps → ⋮ → **Manage debug tokens** → thêm token đó,
   rồi ghi vào `.env.local` dòng `VITE_APPCHECK_DEBUG_TOKEN=...` để lần sau dùng lại.
5. Theo dõi Firebase Console → App Check → **APIs → Cloud Firestore** khoảng 1 ngày. Khi gần như toàn bộ yêu cầu là
   *Verified*, bấm **Enforce**. Từ lúc này Firestore từ chối mọi yêu cầu không đến từ trang thiệp.

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
