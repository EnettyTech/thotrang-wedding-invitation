// Lời mời lưu trong Firestore (collection "invites"): link gửi khách chỉ còn mã ngắn ?i=Ab3dE9,
// còn tên khách và bữa cơm thân mật nằm trong database.
import { getDb } from './firebase.js';

const COLLECTION = 'invites';
// Bỏ các ký tự dễ nhầm (0/O, 1/l/I) để khách gõ lại link không bị sai.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ID_LENGTH = 6;

export const isInviteId = (id) => /^[A-Za-z0-9]{4,12}$/.test(id || '');

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Đọc lời mời theo mã. Trả về { name, meal? } hoặc null nếu không có. */
export async function loadInvite(cfg, id) {
  const db = await getDb(cfg);
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, COLLECTION, id));
  return snap.exists() ? snap.data() : null;
}

/**
 * Tạo lời mời mới với mã ngẫu nhiên, trả về mã.
 * Quy tắc Firestore không cho ghi đè, nên nếu trùng mã (rất hiếm) thì bị từ chối và thử mã khác.
 */
export async function createInvite(cfg, { name, meal }) {
  const db = await getDb(cfg);
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const data = { name, createdAt: serverTimestamp(), ...(meal ? { meal } : {}) };
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = randomId();
    try {
      await setDoc(doc(db, COLLECTION, id), data);
      return id;
    } catch (err) {
      lastError = err;
      if (err?.code !== 'permission-denied') break;
    }
  }
  throw lastError;
}
