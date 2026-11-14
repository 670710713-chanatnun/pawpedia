import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompare } from '../context/CompareContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-700' : 'text-stone-600 hover:bg-stone-100'
  }`;

export default function Navbar() {
  const { member, logout } = useAuth();
  const { ids } = useCompare();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  function onLogout() {
    logout();
    close();
    navigate('/');
  }

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>หน้าแรก</NavLink>
      <NavLink to="/breeds" className={linkClass} onClick={close}>สายพันธุ์ทั้งหมด</NavLink>
      <NavLink to="/compare" className={linkClass} onClick={close}>
        เปรียบเทียบ
        {ids.length > 0 && (
          <span className="ml-1 rounded-full bg-brand-500 px-1.5 text-xs text-white">{ids.length}</span>
        )}
      </NavLink>
      {member && <NavLink to="/favorites" className={linkClass} onClick={close}>รายการโปรด</NavLink>}
      {member?.role === 'admin' && <NavLink to="/admin" className={linkClass} onClick={close}>ผู้ดูแลระบบ</NavLink>}
    </>
  );

  const account = member ? (
    <>
      <NavLink to="/profile" className={linkClass} onClick={close}>
        👤 {member.display_name}
      </NavLink>
      <button type="button" className="btn-ghost" onClick={onLogout}>ออกจากระบบ</button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={linkClass} onClick={close}>เข้าสู่ระบบ</NavLink>
      <Link to="/register" className="btn-primary" onClick={close}>สมัครสมาชิก</Link>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-600" onClick={close}>
          <span aria-hidden="true">🐾</span> Pawpedia
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="เมนูหลัก">{links}</nav>
        <div className="flex items-center gap-1">
          {/* ปุ่มบัญชีแสดงตั้งแต่จอขนาดกลาง (แท็บเล็ต/คอม) */}
          <div className="hidden items-center gap-1 sm:flex">{account}</div>
          {/* จอมือถือ: Guest ยังเห็นปุ่มเข้าสู่ระบบเสมอ */}
          {!member && (
            <Link to="/login" className="btn-primary sm:hidden" onClick={close}>เข้าสู่ระบบ</Link>
          )}
          <button
            type="button"
            className="btn-ghost lg:hidden"
          aria-label="เปิดเมนู"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
            <span className="text-xl" aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-stone-200 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="เมนูมือถือ">
            {links}
            <div className="my-2 border-t border-stone-100 sm:hidden" />
            <div className="flex flex-col gap-1 sm:hidden">{account}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
