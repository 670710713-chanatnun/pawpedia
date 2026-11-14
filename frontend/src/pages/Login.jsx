import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/States';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'กรุณากรอกอีเมล';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  if (!password) errors.password = 'กรุณากรอกรหัสผ่าน';
  return errors;
}

export default function Login() {
  const { login, member } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (member && !busy) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const v = validateLogin(form);
    setErrors(v);
    setServerError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const m = await login(form.email.trim(), form.password);
      const from = location.state?.from?.pathname;
      navigate(from || (m.role === 'admin' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-stone-500">เข้าสู่ระบบเพื่อบันทึกสายพันธุ์ที่ชอบ</p>
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Alert>{serverError}</Alert>
          <div>
            <label htmlFor="email" className="label">อีเมล</label>
            <input id="email" type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="label">รหัสผ่าน</label>
            <input id="password" type="password" autoComplete="current-password" className="input" value={form.password} onChange={set('password')} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>
          <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
            {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          ยังไม่มีบัญชี? <Link to="/register" className="font-medium text-brand-600 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}
