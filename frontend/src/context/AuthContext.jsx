import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { getToken, setToken } from '../api/client';

// ค่า default ทำให้ component render ได้แม้ไม่มี Provider (สะดวกตอนเขียน test)
export const AuthContext = createContext({
  member: null,
  ready: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setMember: () => {},
});

export function AuthProvider({ children }) {
  const [member, setMember] = useState(null);
  const [ready, setReady] = useState(false);

  // เปิดเว็บมาใหม่: ถ้ามี token ให้ถาม Backend ว่าเป็นใคร (ไม่เชื่อข้อมูลใน localStorage)
  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    authApi
      .getMe()
      .then(setMember)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setMember(null);
  }, []);

  // client.js ส่ง event นี้เมื่อ Backend ตอบ 401
  useEffect(() => {
    window.addEventListener('pawpedia:unauthorized', logout);
    return () => window.removeEventListener('pawpedia:unauthorized', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setMember(res.member);
    return res.member;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    setToken(res.token);
    setMember(res.member);
    return res.member;
  }, []);

  const value = useMemo(
    () => ({ member, ready, login, register, logout, setMember }),
    [member, ready, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
