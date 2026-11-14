import { Link } from 'react-router-dom';
import { getStats } from '../../api/admin';
import { useAsync } from '../../hooks/useAsync';
import { ErrorState, Loading } from '../../components/States';
import { sizeLabel } from '../../utils/format';

function StatCard({ label, value, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        <span className="text-2xl" aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Bars({ items, labelOf = (x) => x }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{labelOf(i.label)}</span>
            <span className="font-medium">{i.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-stone-100">
            <div className="h-2.5 rounded-full bg-brand-500" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboard() {
  const { data: s, loading, error, reload } = useAsync(getStats, []);
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="สายพันธุ์ทั้งหมด" value={s.total_breeds} icon="🐕" />
        <StatCard label="หมวดหมู่" value={s.total_categories} icon="🏷️" />
        <StatCard label="สมาชิก" value={s.total_members} icon="👥" />
        <StatCard label="รายการโปรดทั้งหมด" value={s.total_favorites} icon="♥" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">จำนวนสายพันธุ์ตามขนาด</h2>
          <Bars items={s.by_size} labelOf={(v) => `พันธุ์${sizeLabel(v)}`} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">จำนวนสายพันธุ์ตามหมวดหมู่</h2>
          {s.by_category.length === 0 ? <p className="text-sm text-stone-500">ยังไม่มีข้อมูล</p> : <Bars items={s.by_category} />}
        </div>
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">สายพันธุ์ยอดนิยม (ถูกเพิ่มในรายการโปรดมากที่สุด)</h2>
        {s.top_favorites.length === 0 ? (
          <p className="text-sm text-stone-500">ยังไม่มีสมาชิกเพิ่มรายการโปรด</p>
        ) : (
          <ol className="space-y-2">
            {s.top_favorites.map((t, i) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="mr-2 text-stone-400">#{i + 1}</span>
                  <Link to={`/breeds/${t.id}`} className="hover:text-brand-600">{t.name_en}</Link>
                </span>
                <span className="font-medium">♥ {t.count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="text-xs text-stone-400">ผู้ดูแลระบบ {s.total_admins} บัญชี</p>
    </div>
  );
}
