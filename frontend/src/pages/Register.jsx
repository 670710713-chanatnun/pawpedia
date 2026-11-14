import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/States';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.display_name.trim()) e.display_name = 'กรุณากรอกชื่อที่แสดง';
  else if (f.display_name.trim().length > 60) e.display_name = 'ชื่อต้องไม่เกิน 60 ตัวอักษร';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  if (f.password.length < 8) e.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (f.confirm !== f.password) e.confirm = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
  return e;
}

export default function Register() {
  const { register, member } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ display_name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (member && !busy) return <Navigate to="/" replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setServerError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await register({ email: form.email.trim(), password: form.password, display_name: form.display_name.trim() });
      navigate('/', { replace: true });
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  }

  const field = (key, label, type = 'text', autoComplete) => (
    <div>
      <label htmlFor={key} className="label">{label}</label>
      <input id={key} type={type} autoComplete={autoComplete} className="input" value={form[key]} onChange={set(key)} />
      {errors[key] && <p className="field-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="container-page flex justify-center py-14">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-stone-500">สมัครฟรี เพื่อบันทึกรายการสายพันธุ์ที่ชอบ</p>
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Alert>{serverError}</Alert>
          {field('display_name', 'ชื่อที่แสดง', 'text', 'nickname')}
          {field('email', 'อีเมล', 'email', 'email')}
          {field('password', 'รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)', 'password', 'new-password')}
          {field('confirm', 'ยืนยันรหัสผ่าน', 'password', 'new-password')}
          <button type="submit" className="btn-primary w-full !py-2.5" disabled={busy}>
            {busy ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-500">
          มีบัญชีแล้ว? <Link to="/login" className="font-medium text-brand-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
