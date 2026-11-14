// ตัวกลางเรียก Backend ด้วย Fetch API — ทุกไฟล์ใน src/api ใช้ฟังก์ชันนี้
const BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'pawpedia.token';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage ใช้ไม่ได้ (เช่น private mode) — ข้ามไป */
  }
}

/**
 * เรียก API แล้วคืน JSON
 * - แนบ Authorization: Bearer <token> ให้อัตโนมัติถ้า login อยู่
 * - ถ้า status ไม่ใช่ 2xx จะ throw ApiError พร้อมข้อความจาก Backend
 */
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (เซิร์ฟเวอร์อาจกำลังตื่น ลองใหม่อีกครั้ง)');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // token หมดอายุ/ไม่ถูกต้อง → แจ้ง AuthContext ให้ logout
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event('pawpedia:unauthorized'));
    }
    throw new ApiError(
      res.status,
      data?.error?.code || `HTTP_${res.status}`,
      data?.error?.message || `เกิดข้อผิดพลาด (${res.status})`
    );
  }
  return data;
}

export function toQuery(params) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}
