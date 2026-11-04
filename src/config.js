// ============================================================
//  NỘI DUNG THIỆP CƯỚI – chỉ cần sửa file này.
//  Ảnh đặt trong thư mục /public/photos, nhạc trong /public/music. Đường dẫn bắt đầu bằng "/".
// ============================================================

export const config = {
  groom: {
    name: 'Hữu Thọ',
    fullName: 'Nguyễn Hữu Thọ',
    parents: ['Ông Nguyễn Trung Thông', 'Bà Lê Thị Vân'],
  },
  bride: {
    name: 'Nguyễn Trang',
    fullName: 'Nguyễn Thị Trang',
    parents: ['Ông Nguyễn Văn Cơ', 'Bà Đỗ Thị Hà'],
  },

  // Chữ lồng trên con dấu và góc trên trang.
  monogram: 'T & T',

  // Thời điểm bắt đầu tiệc chính (dùng cho đếm ngược và "Thêm vào lịch").
  date: '2026-12-12T11:00:00+07:00',
  dateText: 'Thứ Bảy · 12 · 12 · 2026',
  lunarText: 'Tức ngày 04 tháng 11 Năm Bính Ngọ', // ví dụ: 'Nhằm ngày ... tháng ... năm Bính Ngọ'

  // Lời chào khi link không có tên khách (?to=...)
  defaultGuest: 'Quý khách',

  // Câu chuyện tình yêu – mỗi chương là một khung ảnh 3D khi cuộn trang.
  story: [
    {
      year: '2026',
      title: 'Lần đầu gặp gỡ',
      text: 'Lần đầu tiên gặp nhau tại quán cafe 8Hours Coffee & Kitchen. Ai ngờ đó là trang đầu tiên của câu chuyện chúng mình.',
      photo: '/photos/story-1.jpg',
    },
    {
      year: '2026',
      title: 'Những ngày xa nhau',
      text: 'Một thành phố, hàng nghìn tin nhắn và những chuyến xe đêm. Khoảng cách chỉ khiến chúng mình hiểu rằng mình cần nhau đến thế nào.',
      photo: '/photos/story-2.jpg',
    },
    {
      year: '2026',
      title: 'Lời cầu hôn',
      text: 'Lời cầu hôn đơn giản nhưng rất thật thà.',
      photo: '/photos/story-3.jpg',
    },
    {
      year: '2026',
      title: 'Về chung một nhà',
      text: 'Chúng mình sắp bắt đầu chương mới, và rất mong có bạn ở đó để chứng kiến.',
      photo: '/photos/story-4.jpg',
    },
  ],

  // Ảnh cưới chính – xuất hiện phía sau đôi nhẫn.
  coverPhoto: '/photos/cover.jpg',

  events: [
    {
      title: 'Lễ Vu Quy',
      time: '9h10',
      date: '10/12/2026',
      place: 'Tư gia nhà gái',
      address: 'H5-5 Đại lộ Nam Sông Mã Đỗ Huy Cư, Thành phố Thanh Hóa',
      mapQuery: 'H5-5 Đại lộ Nam Sông Mã Đỗ Huy Cư, Thành phố Thanh Hóa',
    },
    {
      title: 'Lễ Thành Hôn',
      time: '10:10',
      date: '12/12/2026',
      place: 'Tư gia nhà trai',
      address: 'Xóm 8, Nga Yên, Nga Sơn, Thanh Hóa',
      mapQuery: 'Xóm 8, Nga Yên, Nga Sơn, Thanh Hóa',
    },
    {
      title: 'Tiệc Cưới',
      time: '11:00',
      date: '12/12/2026',
      place: 'Tư gia nhà trai',
      address: 'Xóm 8, Nga Yên, Nga Sơn, Thanh Hóa',
      mapQuery: 'Xóm 8, Nga Yên, Nga Sơn, Thanh Hóa',
      main: true, // bản đồ nhúng + nút "Thêm vào lịch"
    },
  ],

  gallery: [
    '/photos/album-1.jpg',
    '/photos/album-2.jpg',
    '/photos/album-3.jpg',
    '/photos/album-4.jpg',
    '/photos/album-5.jpg',
    '/photos/album-6.jpg',
    '/photos/album-7.jpg',
    '/photos/album-8.jpg',
    '/photos/album-9.jpg',
  ],

  // Sổ lời chúc – lưu trên Firebase Firestore để mọi khách cùng thấy realtime.
  // apiKey và appId đọc từ biến môi trường (.env.local khi dev, Environment Variables trên Vercel).
  // Thiếu thì lời chúc chỉ lưu tạm trên trình duyệt đang mở (dùng để thử).
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: 'tho-trang-wedding.firebaseapp.com',
    projectId: 'tho-trang-wedding',
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    // Site key reCAPTCHA v3 cho App Check (để trống thì không bật App Check).
    recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  },

  // Nhạc nền (tuỳ chọn). Nếu file không tồn tại, nút nhạc sẽ tự ẩn.
  music: '/music/song.m4a',
};
