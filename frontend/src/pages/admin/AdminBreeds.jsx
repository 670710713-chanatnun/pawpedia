import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listBreeds } from '../../api/breeds';
import { deleteBreed } from '../../api/admin';
import { useAsync } from '../../hooks/useAsync';
import BreedImage from '../../components/BreedImage';
import SizeBadge from '../../components/SizeBadge';
import Pagination from '../../components/Pagination';
import { Alert, EmptyState, ErrorState, Loading } from '../../components/States';

const LIMIT = 20;

export default function AdminBreeds() {
  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState('');
  const { data, loading, error, reload } = useAsync(() => listBreeds({ q, page, limit: LIMIT }), [q, page]);

  async function onDelete(b) {
    if (!window.confirm(`ลบสายพันธุ์ "${b.name_en}" ใช่หรือไม่?\nรายการโปรดของสมาชิกที่เกี่ยวข้องจะถูกลบด้วย`)) return;
    try {
      await deleteBreed(b.id);
      setMsg(`ลบ "${b.name_en}" แล้ว`);
      reload();
    } catch (err) {
      window.alert(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">จัดการสายพันธุ์ {data && <span className="text-stone-400">({data.total})</span>}</h2>
        <Link to="/admin/breeds/new" className="btn-primary">+ เพิ่มสายพันธุ์</Link>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(input.trim());
        }}
      >
        <input className="input" placeholder="ค้นหาชื่อสายพันธุ์..." value={input} onChange={(e) => setInput(e.target.value)} aria-label="ค้นหาสายพันธุ์" />
        <button className="btn-outline" type="submit">ค้นหา</button>
      </form>
      <Alert type="success">{msg}</Alert>

      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="ไม่พบสายพันธุ์" message="ลองค้นหาด้วยคำอื่น หรือเพิ่มสายพันธุ์ใหม่" />}
      {data && data.items.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-stone-50 text-left text-stone-500">
              <tr>
                <th className="p-3">สายพันธุ์</th>
                <th className="p-3">ขนาด</th>
                <th className="p-3">หมวดหมู่</th>
                <th className="p-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="border-t border-stone-100">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <BreedImage src={b.image_url} name={b.name_en} className="h-10 w-10 shrink-0 overflow-hidden rounded-lg text-[0px]" />
                      <div>
                        <Link to={`/breeds/${b.id}`} className="font-medium hover:text-brand-600">{b.name_en}</Link>
                        <p className="text-xs text-stone-500">{b.name_th}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><SizeBadge size={b.size} /></td>
                  <td className="p-3">{b.category_name || <span className="text-stone-400">-</span>}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/breeds/${b.id}/edit`} className="btn-outline !px-3 !py-1.5">แก้ไข</Link>
                      <button type="button" className="btn-danger !px-3 !py-1.5" onClick={() => onDelete(b)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} total={data.total} limit={LIMIT} onChange={setPage} />}
    </div>
  );
}
