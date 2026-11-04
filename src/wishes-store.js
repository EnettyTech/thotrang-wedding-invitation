// Nơi lưu lời chúc.
// - Có cấu hình Firebase trong config.js → lưu Firestore, mọi khách thấy realtime.
// - Chưa có → lưu tạm trên trình duyệt này (localStorage), chỉ để thử giao diện.

export const LIMITS = { name: 60, message: 500 };
const COLLECTION = 'wishes';
const MAX_SHOWN = 100;

export async function createWishesStore(firebaseConfig) {
  if (firebaseConfig?.projectId && firebaseConfig?.apiKey) return firestoreStore(firebaseConfig);
  console.info('[Lời chúc] Chưa cấu hình Firebase – đang lưu tạm trên trình duyệt này.');
  return localStore();
}

async function firestoreStore({ recaptchaSiteKey, ...cfg }) {
  // Chỉ tải Firebase khi thật sự dùng để trang đầu nhẹ hơn.
  const { initializeApp } = await import('firebase/app');
  const { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } = await import(
    'firebase/firestore'
  );
  const app = initializeApp(cfg);
  if (recaptchaSiteKey) await enableAppCheck(app, recaptchaSiteKey);
  const db = getFirestore(app);
  const col = collection(db, COLLECTION);

  return {
    mode: 'firebase',
    subscribe(onChange, onError) {
      const q = query(col, orderBy('createdAt', 'desc'), limit(MAX_SHOWN));
      return onSnapshot(
        q,
        (snap) =>
          onChange(
            snap.docs.map((d) => ({
              id: d.id,
              name: d.data().name,
              message: d.data().message,
              // Lời chúc vừa gửi chưa có giờ từ server: tạm dùng giờ máy.
              createdAt: d.data({ serverTimestamps: 'estimate' }).createdAt?.toMillis() ?? Date.now(),
            })),
          ),
        onError,
      );
    },
    async add({ name, message }) {
      const ref = await addDoc(col, { name, message, createdAt: serverTimestamp() });
      return ref.id;
    },
  };
}

// App Check: Firebase chỉ nhận yêu cầu từ đúng trang thiệp (xác minh ngầm bằng reCAPTCHA v3),
// nên người khác lấy cấu hình rồi viết script spam sẽ bị chặn khi đã bật Enforce.
async function enableAppCheck(app, siteKey) {
  const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
  if (import.meta.env.DEV) {
    // localhost và IP mạng nội bộ không qua được reCAPTCHA: dùng debug token đã đăng ký trên Firebase Console.
    // Chưa có token thì SDK in một token mới ra console để bạn đăng ký.
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(siteKey), isTokenAutoRefreshEnabled: true });
}

function localStore() {
  const KEY = 'wedding-wishes';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(KEY) : null;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  };
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(read()));
  channel?.addEventListener('message', emit);

  return {
    mode: 'local',
    subscribe(onChange) {
      listeners.add(onChange);
      onChange(read());
      return () => listeners.delete(onChange);
    },
    async add({ name, message }) {
      const id = String(Date.now());
      const list = [{ id, name, message, createdAt: Date.now() }, ...read()].slice(0, MAX_SHOWN);
      try {
        localStorage.setItem(KEY, JSON.stringify(list));
      } catch {
        // Trình duyệt chặn lưu trữ: vẫn hiện trong phiên này.
      }
      emit();
      channel?.postMessage('changed');
      return id;
    },
  };
}

// Lời chúc giả để xem thử giao diện (?fake=100 khi chạy dev). Chỉ nằm trong bộ nhớ, không ghi đi đâu.
export function fakeStore(count) {
  const names = ['Anh Tuấn', 'Chị Hương', 'Bạn Linh', 'Minh Khôi', 'Cô Lan', 'Chú Bình', 'Hà My', 'Quang Huy',
    'Thảo Vy', 'Đức Anh', 'Ngọc Ánh', 'Bác Sơn', 'Phương Thảo', 'Trung Kiên', 'Gia đình chị Mai', 'Hoàng Long'];
  const messages = ['Chúc mừng hạnh phúc!', 'Trăm năm hạnh phúc nhé hai bạn ❤',
    'Chúc hai bạn luôn yêu thương, thấu hiểu và cùng nhau đi hết cuộc đời.',
    'Sớm có tin vui nha! Hôm đó nhất định mình sẽ đến.',
    'Ở xa không về được, gửi lời chúc qua đây: bạch đầu giai lão, sắt son trọn đời.',
    'Nhìn ảnh cưới mà thấy hạnh phúc lây. Chúc hai đứa mãi như ngày đầu!',
    'Chúc cô dâu chú rể trăm năm hảo hợp, con cháu đầy đàn.',
    'Thương hai bạn nhiều lắm. Mong mọi ngày sau đều ấm áp như hôm nay.',
    'Happy wedding! 🎉', 'Chúc mừng em trai nhé, cuối cùng cũng lấy được vợ rồi 😆',
    'Hạnh phúc không phải là đích đến mà là cả hành trình. Chúc hai bạn có một hành trình thật đẹp, nhiều tiếng cười và ít nước mắt.'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const now = Date.now();
  let list = Array.from({ length: count }, (_, i) => ({
    id: `fake-${i}`,
    name: pick(names),
    message: pick(messages),
    createdAt: now - (count - i) * (5 + Math.random() * 180) * 60000,
  })).sort((a, b) => b.createdAt - a.createdAt);
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(list));
  // Thêm một lời chúc mỗi 8 giây để xem hiệu ứng realtime.
  setInterval(() => {
    list = [{ id: `fake-${Date.now()}`, name: pick(names), message: pick(messages), createdAt: Date.now() }, ...list];
    emit();
  }, 8000);
  return {
    mode: 'fake',
    subscribe(onChange) {
      listeners.add(onChange);
      onChange(list);
      return () => listeners.delete(onChange);
    },
    async add({ name, message }) {
      const id = `fake-${Date.now()}`;
      list = [{ id, name, message, createdAt: Date.now() }, ...list];
      emit();
      return id;
    },
  };
}
