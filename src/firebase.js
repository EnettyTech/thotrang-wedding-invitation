// Kết nối Firebase dùng chung cho thiệp (lời chúc, lời mời) và trang tạo link.
// Chỉ tải SDK khi thật sự cần, khởi động một lần, bật App Check nếu có site key reCAPTCHA.

let dbPromise = null;

export const hasFirebase = (cfg) => !!(cfg?.projectId && cfg?.apiKey);

export function getDb({ recaptchaSiteKey, ...cfg }) {
  dbPromise ??= (async () => {
    const { initializeApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    const app = initializeApp(cfg);
    if (recaptchaSiteKey) await enableAppCheck(app, recaptchaSiteKey);
    return getFirestore(app);
  })();
  return dbPromise;
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
