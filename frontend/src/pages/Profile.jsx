import { useState } from 'react';
import { changePassword, updateMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Alert } from '../components/States';
import { formatDate } from '../utils/format';

function ProfileForm() {
  const { member, setMember } = useAuth();
  const [form, setForm] = useState({ display_name: member.display_name, avatar_url: member.avatar_url || '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.display_name.trim()) {
      setMsg({ type: 'error', text: 'กรุณากรอกชื่อที่แสดง' });
      return;
    }
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      const updated = await updateMe({ display_name: form.display_name.trim(), avatar_url: form.avatar_url.trim() });
      setMember(updated);
      setMsg({ type: 'success', text: 'บันทึกข้อมูลโปรไฟล์เรียบร้อย' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-lg font-semibold">แก้ไขข้อมูลส่วนตัว</h2>
      <Alert type={msg.type || 'error'}>{msg.text}</Alert>
      <div>
        <label htmlFor="display_name" className="label">ชื่อที่แสดง</label>
        <input id="display_name" className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
      </div>
      <div>
        <label htmlFor="avatar_url" className="label">ลิงก์รูปโปรไฟล์ (ไม่บังคับ)</label>
        <input id="avatar_url" className="input" placeholder="https://..." value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
      </div>
      <div>
        <span className="label">อีเมล</span>
        <p className="text-sm text-stone-500">{member.email} (เปลี่ยนไม่ได้)</p>
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึก'}</button>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.current) return setMsg({ type: 'error', text: 'กรุณากรอกรหัสผ่านเดิม' });
    if (form.next.length < 8) return setMsg({ type: 'error', text: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    if (form.next !== form.confirm) return setMsg({ type: 'error', text: 'ยืนยันรหัสผ่านใหม่ไม่ตรงกัน' });
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await changePassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setMsg({ type: 'success', text: 'เปลี่ยนรหัสผ่านเรียบร้อย ครั้งหน้าให้ใช้รหัสผ่านใหม่' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h2 className="text-lg font-semibold">เปลี่ยนรหัสผ่าน</h2>
      <Alert type={msg.type || 'error'}>{msg.text}</Alert>
      <div>
        <label htmlFor="current" className="label">รหัสผ่านเดิม</label>
        <input id="current" type="password" autoComplete="current-password" className="input" value={form.current} onChange={set('current')} />
      </div>
      <div>
        <label htmlFor="next" className="label">รหัสผ่านใหม่</label>
        <input id="next" type="password" autoComplete="new-password" className="input" value={form.next} onChange={set('next')} />
      </div>
      <div>
        <label htmlFor="confirm" className="label">ยืนยันรหัสผ่านใหม่</label>
        <input id="confirm" type="password" autoComplete="new-password" className="input" value={form.confirm} onChange={set('confirm')} />
      </div>
      <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</button>
    </form>
  );
}

export default function Profile() {
  const { member } = useAuth();
  return (
    <div className="container-page py-10">
      <div className="card flex flex-col items-center gap-4 p-6 sm:flex-row">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.display_name} className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
            {member.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">{member.display_name}</h1>
          <p className="text-sm text-stone-500">{member.email}</p>
          <p className="mt-1 text-xs text-stone-400">
            {member.role === 'admin' ? 'ผู้ดูแลระบบ' : 'สมาชิก'} · สมัครเมื่อ {formatDate(member.created_at)} · รายการโปรด {member.favorite_count ?? 0} รายการ
          </p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
