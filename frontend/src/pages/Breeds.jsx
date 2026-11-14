import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listBreeds, listCategories } from '../api/breeds';
import { useAsync } from '../hooks/useAsync';
import BreedCard from '../components/BreedCard';
import SizeFilter from '../components/SizeFilter';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, Loading } from '../components/States';

const LIMIT = 12;

export default function Breeds() {
  // เก็บเงื่อนไขค้นหาไว้ใน URL → แชร์ลิงก์/กด back ได้
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const size = params.get('size') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [input, setInput] = useState(q);
  useEffect(() => setInput(q), [q]);

  const list = useAsync(() => listBreeds({ q, size, category, page, limit: LIMIT }), [q, size, category, page]);
  const categories = useAsync(listCategories, []);

  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  }

  function onSearch(e) {
    e.preventDefault();
    update('q', input.trim());
  }

  const hasFilter = q || size || category;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold">สายพันธุ์สุนัขทั้งหมด</h1>
      <p className="mt-1 text-stone-500">ค้นหาด้วยชื่อภาษาไทย/อังกฤษ หรือประเทศต้นกำเนิด แล้วกรองตามขนาดและหมวดหมู่</p>

      <div className="card mt-6 space-y-4 p-4">
        <form onSubmit={onSearch} className="flex gap-2" role="search">
          <input
            className="input"
            placeholder="ค้นหาสายพันธุ์..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="ค้นหาสายพันธุ์"
          />
          <button type="submit" className="btn-primary">ค้นหา</button>
        </form>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SizeFilter value={size} onChange={(v) => update('size', v)} />
          <select
            className="input md:w-64"
            value={category}
            onChange={(e) => update('category', e.target.value)}
            aria-label="กรองตามหมวดหมู่"
          >
            <option value="">ทุกหมวดหมู่</option>
            {(categories.data || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}{c.name_th ? ` — ${c.name_th}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {list.loading && <Loading />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.data && list.data.items.length === 0 && (
          <EmptyState
            icon="🔍"
            title="ไม่พบสายพันธุ์ที่ค้นหา"
            message="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองแล้วลองใหม่"
            action={hasFilter && <button type="button" className="btn-outline" onClick={() => setParams({})}>ล้างตัวกรอง</button>}
          />
        )}
        {list.data && list.data.items.length > 0 && (
          <>
            <p className="mb-4 text-sm text-stone-500">พบ {list.data.total} สายพันธุ์</p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {list.data.items.map((b) => <BreedCard key={b.id} breed={b} />)}
            </div>
            <Pagination page={page} total={list.data.total} limit={LIMIT} onChange={(p) => update('page', String(p))} />
          </>
        )}
      </div>
    </div>
  );
}
