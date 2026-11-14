import { NavLink, Outlet } from 'react-router-dom';

const items = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/breeds', label: '🐕 จัดการสายพันธุ์' },
  { to: '/admin/categories', label: '🏷️ จัดการหมวดหมู่' },
  { to: '/admin/members', label: '👥 จัดการสมาชิก' },
];

export default function AdminLayout() {
  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center gap-2">
        <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-white">ADMIN</span>
        <h1 className="text-2xl font-bold">แผงผู้ดูแลระบบ</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="เมนูผู้ดูแลระบบ" className="flex gap-2 overflow-x-auto lg:flex-col">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-stone-600 hover:bg-stone-100'
                }`
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
