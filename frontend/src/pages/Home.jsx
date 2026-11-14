import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listBreeds, listCategories } from '../api/breeds';
import { useAsync } from '../hooks/useAsync';
import BreedCard from '../components/BreedCard';
import { EmptyState, ErrorState, Loading } from '../components/States';

const SIZE_CARDS = [
  { value: 'small', icon: '🐕', title: 'พันธุ์เล็ก', en: 'Small', desc: 'น้ำหนักไม่เกิน ~10 กก. เหมาะกับคอนโด', color: 'from-sky-100 to-sky-50' },
  { value: 'medium', icon: '🐕‍🦺', title: 'พันธุ์กลาง', en: 'Medium', desc: 'ประมาณ 10–25 กก. คล่องแคล่ว', color: 'from-emerald-100 to-emerald-50' },
  { value: 'large', icon: '🦮', title: 'พันธุ์ใหญ่', en: 'Large', desc: 'มากกว่า ~25 กก. ต้องการพื้นที่', color: 'from-violet-100 to-violet-50' },
];

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const featured = useAsync(() => listBreeds({ limit: 8 }), []);
  const categories = useAsync(listCategories, []);

  function onSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/breeds?q=${encodeURIComponent(q.trim())}` : '/breeds');
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-amber-50 to-white">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
              🐾 สารานุกรมสายพันธุ์สุนัข
            </p>
            <h1 className="text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
              ค้นหาสุนัขที่ <span className="text-brand-600">ใช่</span> สำหรับคุณ
            </h1>
            <p className="mt-4 text-stone-600">
              รวมข้อมูลสายพันธุ์สุนัขทั่วโลก ทั้งขนาด นิสัย อายุขัย และวิธีดูแล
              ค้นหา กรอง และเปรียบเทียบได้ในที่เดียว
            </p>
            <form onSubmit={onSearch} className="mt-6 flex gap-2" role="search">
              <input
                className="input !py-3"
                placeholder="พิมพ์ชื่อสายพันธุ์ เช่น Golden, ชิบะ, ไทยหลังอาน"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="ค้นหาสายพันธุ์"
              />
              <button className="btn-primary !px-6" type="submit">ค้นหา</button>
            </form>
          </div>
          <div className="hidden justify-center md:flex">
            <div className="flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-amber-100 text-[9rem] shadow-inner">
              🐶
            </div>
          </div>
        </div>
      </section>

      <div className="container-page space-y-14 py-12">
        {/* แบ่งตามขนาด */}
        <section>
          <h2 className="mb-4 text-2xl font-bold">เลือกดูตามขนาด</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {SIZE_CARDS.map((s) => (
              <Link
                key={s.value}
                to={`/breeds?size=${s.value}`}
                className={`card bg-gradient-to-br ${s.color} p-6 transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="text-4xl" aria-hidden="true">{s.icon}</div>
                <h3 className="mt-3 text-lg font-semibold">
                  {s.title} <span className="text-sm font-normal text-stone-500">({s.en})</span>
                </h3>
                <p className="text-sm text-stone-600">{s.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* หมวดหมู่ */}
        <section>
          <h2 className="mb-4 text-2xl font-bold">หมวดหมู่สายพันธุ์</h2>
          {categories.loading && <Loading />}
          {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} />}
          {categories.data && categories.data.length === 0 && <EmptyState title="ยังไม่มีหมวดหมู่" />}
          {categories.data && categories.data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.data.map((c) => (
                <Link
                  key={c.id}
                  to={`/breeds?category=${c.id}`}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm hover:border-brand-400 hover:text-brand-700"
                >
                  {c.name_th || c.name_en} <span className="text-stone-400">({c.breed_count})</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* สายพันธุ์แนะนำ */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold">สายพันธุ์ในฐานข้อมูล</h2>
            <Link to="/breeds" className="text-sm font-medium text-brand-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          {featured.loading && <Loading />}
          {featured.error && <ErrorState error={featured.error} onRetry={featured.reload} />}
          {featured.data && featured.data.items.length === 0 && (
            <EmptyState title="ยังไม่มีข้อมูลสายพันธุ์" message="ผู้ดูแลระบบยังไม่ได้เพิ่มข้อมูล" />
          )}
          {featured.data && featured.data.items.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.data.items.map((b) => <BreedCard key={b.id} breed={b} />)}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
