// Trên điện thoại, thanh địa chỉ và thanh dưới của trình duyệt ẩn hiện khi cuộn làm innerHeight đổi liên tục.
// Dùng chiều cao "khung nhìn lớn" (100lvh) thay thế: giá trị này không đổi khi các thanh đó ẩn hiện,
// chỉ đổi khi xoay máy hoặc đổi cỡ cửa sổ trên máy tính.

const probe = document.createElement('div');
probe.setAttribute('aria-hidden', 'true');
probe.style.cssText =
  'position:fixed;top:0;left:0;width:0;height:100vh;height:100lvh;visibility:hidden;pointer-events:none';
document.documentElement.append(probe);

export const stableHeight = () => probe.offsetHeight || window.innerHeight;

// Chỉ gọi lại khi khung nhìn đổi thật sự, bỏ qua lúc thanh trình duyệt ẩn hiện.
export function onViewportChange(fn) {
  let w = window.innerWidth;
  let h = stableHeight();
  window.addEventListener('resize', () => {
    const nh = stableHeight();
    if (window.innerWidth === w && nh === h) return;
    w = window.innerWidth;
    h = nh;
    fn();
  });
}
