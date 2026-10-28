// ============================================================
//  NỘI DUNG THIỆP CƯỚI – chỉ cần sửa file này.
//  Ảnh đặt trong thư mục /public/photos, QR trong /public/qr,
//  nhạc trong /public/music. Đường dẫn bắt đầu bằng "/".
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
      year: '2019',
      title: 'Lần đầu gặp gỡ',
      text: 'Một buổi chiều mưa ở thư viện trường, hai người cùng với tay lấy một cuốn sách. Ai ngờ đó là trang đầu tiên của câu chuyện chúng mình.',
      photo: '/photos/story-1.svg',
    },
    {
      year: '2021',
      title: 'Những ngày xa nhau',
      text: 'Hai thành phố, hàng nghìn tin nhắn và những chuyến xe đêm. Khoảng cách chỉ khiến chúng mình hiểu rằng mình cần nhau đến thế nào.',
      photo: '/photos/story-2.svg',
    },
    {
      year: '2025',
      title: 'Lời cầu hôn',
      text: 'Dưới bầu trời đầy sao Đà Lạt, anh quỳ xuống với chiếc nhẫn nhỏ. Và em đã nói “Đồng ý”.',
      photo: '/photos/story-3.svg',
    },
    {
      year: '2026',
      title: 'Về chung một nhà',
      text: 'Chúng mình sắp bắt đầu chương mới, và rất mong có bạn ở đó để chứng kiến.',
      photo: '/photos/story-4.svg',
    },
  ],

  // Ảnh cưới chính – xuất hiện phía sau đôi nhẫn.
  coverPhoto: '/photos/cover.svg',

  events: [
    {
      title: 'Lễ Vu Quy',
      time: '08:00',
      date: '12/12/2026',
      place: 'Tư gia nhà gái',
      address: 'H5-5 Đại lộ Nam Sông Mã Đỗ Huy Cư, Thành phố Thanh Hóa',
      mapQuery: 'H5-5 Đại lộ Nam Sông Mã Đỗ Huy Cư, Thành phố Thanh Hóa',
    },
    {
      title: 'Lễ Thành Hôn',
      time: '09:30',
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
    '/photos/album-1.svg',
    '/photos/album-2.svg',
    '/photos/album-3.svg',
    '/photos/album-4.svg',
    '/photos/album-5.svg',
    '/photos/album-6.svg',
    '/photos/album-7.svg',
    '/photos/album-8.svg',
    '/photos/album-9.svg',
  ],

  // Hộp mừng cưới – DỮ LIỆU MẪU, hãy thay bằng tài khoản và QR thật.
  gifts: [
    {
      side: 'Mừng cưới chú rể',
      bank: 'Vietcombank',
      account: '0000 000 000',
      holder: 'NGUYEN HOANG NAM',
      qr: '/qr/groom.svg',
    },
    {
      side: 'Mừng cưới cô dâu',
      bank: 'Techcombank',
      account: '0000 000 000',
      holder: 'LE MINH ANH',
      qr: '/qr/bride.svg',
    },
  ],

  // Nhạc nền (tuỳ chọn). Nếu file không tồn tại, nút nhạc sẽ tự ẩn.
  music: '/music/song.m4a',
};
